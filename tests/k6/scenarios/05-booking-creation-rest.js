/**
 * Scenario 5: Booking Creation (REST)
 * Purpose: Test write operations and conflict detection
 */

import http from 'k6/http';
import { sleep } from 'k6';
import { REST_BASE_URL, LOAD_CONFIGS, TEST_USERS } from '../config/rest.config.js';
import { getRESTToken, authHeaders } from '../utils/auth.js';
import { randomFacilityId, generateFutureDate, generateTimeSlot } from '../utils/data.js';
import { Rate, Counter } from 'k6/metrics';

const successRate = new Rate('booking_success');
const conflictRate = new Rate('booking_conflict');
const systemFailureRate = new Rate('system_failure');

const bookingsCreated = new Counter('bookings_created');
const bookingConflicts = new Counter('booking_conflicts');

export const options = {
  stages: LOAD_CONFIGS.write.stages,
  thresholds: {
    http_req_duration: ['p(95)<1000'],

    booking_success: ['rate>0.70'],     // at least 70% succeed
    booking_conflict: ['rate<0.25'],    // conflicts acceptable but limited
    http_req_failed: ['rate<0.05'],      // real errors must be very low
  },
};

export function setup() {
  const tokens = TEST_USERS.map(user => ({
    userId: user.userId,
    token: getRESTToken(REST_BASE_URL, user.phoneNumber),
  }));
  return { tokens };
}

export default function (data) {
  const userToken = data.tokens[Math.floor(Math.random() * data.tokens.length)];
  const facilityId = randomFacilityId();
  const bookingDate = generateFutureDate();

  const availabilityRes = http.get(
    `${REST_BASE_URL}/facilities/${facilityId}/slots?date=${bookingDate}`,
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
    console.error(`[AVAILABILITY PARSE ERROR]
body=${availabilityRes.body}`);
    systemFailureRate.add(1);
    return;
  }

  const availableSlots = (slotsData.slots || []).filter(s => s.isAvailable);

  if (availableSlots.length === 0) {
    return; // no available slots
  }

  const slot = availableSlots[Math.floor(Math.random() * availableSlots.length)];

  const bookingData = {
    userId: userToken.userId,
    facilityId,
    bookingDate,
    startTime: slot.startTime,
    endTime: slot.endTime,
  };

  const res = http.post(
    `${REST_BASE_URL}/bookings`,
    JSON.stringify(bookingData),
    { headers: authHeaders(userToken.token) }
  );
  if (res.status === 201) {
    successRate.add(1);
    conflictRate.add(0);
    systemFailureRate.add(0);
    bookingsCreated.add(1);

  } else if (res.status === 409) {
    successRate.add(0);
    conflictRate.add(1);
    systemFailureRate.add(0);
    bookingConflicts.add(1);

  } else {
    successRate.add(0);
    conflictRate.add(0);
    systemFailureRate.add(1);
  }

  sleep(1 + Math.random() * 2); // more human-like pacing
}

export function handleSummary(data) {
  return {
    'tests/results/rest/05-booking-creation.json': JSON.stringify(data, null, 2),
  };
}