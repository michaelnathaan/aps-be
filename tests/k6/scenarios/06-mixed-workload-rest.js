/**
 * Scenario 6: Mixed Read-Write Workload (REST)
 * Purpose: Simulate realistic user behavior
 * Distribution: 70% browsing, 20% availability checks, 10% booking creation
 */

import http, { setResponseCallback, expectedStatuses } from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';
import { REST_BASE_URL, LOAD_CONFIGS, TEST_USERS } from '../config/rest.config.js';
import { getRESTToken, authHeaders } from '../utils/auth.js';
import { randomFacilityId, getTomorrowDate } from '../utils/data.js';

setResponseCallback(
  expectedStatuses(
    { min: 200, max: 201 }, // covers 200 and 201
    409                     // explicitly allow conflict
  )
);
const successRate = new Rate('booking_success');
const conflictRate = new Rate('booking_conflict');
const systemFailureRate = new Rate('system_failure');

const browsingRequests = new Counter('browsing_requests');
const availabilityRequests = new Counter('availability_requests');
const bookingRequests = new Counter('booking_requests');

const successfulBookings = new Counter('successful_bookings');
const bookingConflicts = new Counter('booking_conflicts');

// ===== Options =====
export const options = {
  stages: LOAD_CONFIGS.mixed.stages,
  thresholds: {
    http_req_duration: ['p(95)<800'],

    booking_success: ['rate>0.60'],
    booking_conflict: ['rate<0.30'],
    system_failure: ['rate<0.05'],

    http_req_failed: ['rate<0.05'],
  },
};

// ===== Setup =====
export function setup() {
  const tokens = TEST_USERS.map(user => ({
    userId: user.userId,
    token: getRESTToken(REST_BASE_URL, user.phoneNumber),
  }));
  return { tokens };
}

// ===== Main =====
export default function (data) {
  const userToken = data.tokens[Math.floor(Math.random() * data.tokens.length)];
  const random = Math.random();

  // ======================
  // 70% - Browsing
  // ======================
  if (random < 0.7) {
    let response;

    if (Math.random() < 0.5) {
      response = http.get(`${REST_BASE_URL}/facilities`);
      check(response, { 'browsing: facilities list': (r) => r.status === 200 });
    } else {
      const facilityId = randomFacilityId();
      response = http.get(`${REST_BASE_URL}/facilities/${facilityId}`);
      check(response, { 'browsing: facility details': (r) => r.status === 200 });
    }

    if (response.status !== 200) {
      systemFailureRate.add(1);
    } else {
      systemFailureRate.add(0);
    }

    browsingRequests.add(1);
  }

  // ======================
  // 20% - Availability
  // ======================
  else if (random < 0.9) {
    const facilityId = randomFacilityId();
    const date = getTomorrowDate();

    const response = http.get(
      `${REST_BASE_URL}/facilities/${facilityId}/slots?date=${date}`
    );

    check(response, { 'availability: slots check': (r) => r.status === 200 });

    if (response.status !== 200) {
      systemFailureRate.add(1);
    } else {
      systemFailureRate.add(0);
    }

    availabilityRequests.add(1);
  }

  // ======================
  // 10% - Booking
  // ======================
  else {
    const facilityId = randomFacilityId();
    const date = getTomorrowDate();

    const availabilityRes = http.get(
      `${REST_BASE_URL}/facilities/${facilityId}/slots?date=${date}`,
      { headers: authHeaders(userToken.token) }
    );

    if (availabilityRes.status !== 200) {
      systemFailureRate.add(1);
      return;
    }

    let slotsData = {};
    try {
      slotsData = JSON.parse(availabilityRes.body);
    } catch (e) {
      systemFailureRate.add(1);
      return;
    }

    const availableSlots = (slotsData.slots || []).filter(s => s.isAvailable);

    if (availableSlots.length === 0) {
      return; // no slots → not a failure
    }

    const slot = availableSlots[Math.floor(Math.random() * availableSlots.length)];

    const bookingData = {
      userId: userToken.userId,
      facilityId,
      bookingDate: date,
      startTime: slot.startTime,
      endTime: slot.endTime,
    };

    const response = http.post(
      `${REST_BASE_URL}/bookings`,
      JSON.stringify(bookingData),
      { headers: authHeaders(userToken.token) }
    );

    bookingRequests.add(1);

    if (response.status === 201) {
      successRate.add(1);
      conflictRate.add(0);
      systemFailureRate.add(0);
      successfulBookings.add(1);

    } else if (response.status === 409) {
      successRate.add(0);
      conflictRate.add(1);
      systemFailureRate.add(0);
      bookingConflicts.add(1);

    } else {
      successRate.add(0);
      conflictRate.add(0);
      systemFailureRate.add(1);
    }
  }

  sleep(Math.random() * 2 + 1);
}

// ===== Summary =====
export function handleSummary(data) {
  return {
    'tests/results/rest/06-mixed-workload.json': JSON.stringify(data, null, 2),
  };
}