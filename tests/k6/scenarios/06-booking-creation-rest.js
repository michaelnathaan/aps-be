/**
 * Scenario 5: Booking Creation (REST)
 * Purpose: Test write operations and conflict detection
 */

import http from 'k6/http';
import { sleep } from 'k6';
import { REST_BASE_URL, LOAD_CONFIGS, TEST_USERS , ADMIN_USER} from '../config/config.js';
import { getRESTToken, authHeaders } from '../utils/auth.js';
import { randomFacilityId, generateFutureDate } from '../utils/data.js';
import { Rate, Counter } from 'k6/metrics';

const successRate = new Rate('booking_success');
const conflictRate = new Rate('booking_conflict');
const systemFailureRate = new Rate('system_failure');

const bookingsCreated = new Counter('bookings_created');
const bookingConflicts = new Counter('booking_conflicts');
const bookingDeleted = new Counter('booking_deleted');

export const options = {
  stages: LOAD_CONFIGS.write.stages,
  thresholds: {
    http_req_duration: ['p(95)<2000'],

    booking_success: ['rate>0.90'],     // at least 90% succeed
    booking_conflict: ['rate<0.25'],    // conflicts acceptable but limited
    http_req_failed: ['rate<0.05'],      // real errors must be very low
  },
};

export function setup() {
  const tokens = TEST_USERS.map(user => ({
    userId: user.userId,
    token: getRESTToken(REST_BASE_URL, user.phoneNumber),
  }));
  const adminToken = getRESTToken(REST_BASE_URL, ADMIN_USER.phoneNumber);
  return { tokens , adminToken };
}

// SKIP CHECK AVAIL SLOT
// LANGSUNG CREATE TERUS DELETE...
export default function (data) {
  const userToken = data.tokens[Math.floor(Math.random() * data.tokens.length)];
  const facilityId = randomFacilityId();

  const bookingDate = generateFutureDate();
  const startHour = Math.floor(Math.random() * (20 - 8) + 8); // 8 AM to 8 PM
  const startTime = `${startHour.toString().padStart(2, '0')}:00:00`;
  const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00:00`;
  
  const bookingData = {
    userId: userToken.userId,
    facilityId,
    bookingDate,
    startTime,
    endTime,
  };

  const res = http.post(
    `${REST_BASE_URL}/bookings`,
    JSON.stringify(bookingData),
    { headers: authHeaders(userToken.token) }
  );

  if (res.status === 201) {
    successRate.add(1);
    conflictRate.add(0);
    bookingsCreated.add(1);

    try {
      const createdBooking = JSON.parse(res.body);
      const bookingId = createdBooking.id;

      if (bookingId) {
        const deleteRes = http.del(
          `${REST_BASE_URL}/bookings/${bookingId}/hard`,
          null,
          { headers: authHeaders(data.adminToken) }
        );

        if (deleteRes.status === 200 || deleteRes.status === 204) {
          bookingDeleted.add(1);
        } else {
          console.error(`[DELETE FAILED] ID: ${bookingId}, Status: ${deleteRes.status}`);
        }
      }
    } catch (e) {
      console.error(`[PARSE ERROR] Could not read booking ID from response`);
      systemFailureRate.add(1);
    }

  } else if (res.status === 409) {
    successRate.add(0);
    conflictRate.add(1);
    systemFailureRate.add(0);
    bookingConflicts.add(1);
    console.log(`[REST Booking Conflict] ${JSON.stringify(bookingData)}`);
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