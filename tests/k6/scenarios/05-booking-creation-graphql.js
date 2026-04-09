/**
 * Scenario 5: Booking Creation (GraphQL)
 * Purpose: Test write operations and conflict detection
 * 1. Get available slots
 * 2. Pick valid slot
 * 3. Create booking
 */

import http from 'k6/http';
import { sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import {
  GRAPHQL_URL,
  LOAD_CONFIGS,
  TEST_USERS,
  ADMIN_USER,
  createGraphQLPayload
} from '../config/graphql.config.js';
import { getGraphQLToken, authHeaders } from '../utils/auth.js';
import { randomFacilityId, generateFutureDate } from '../utils/data.js';

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

    booking_success: ['rate>0.70'],
    booking_conflict: ['rate<0.25'],
    http_req_failed: ['rate<0.05'],
  },
};

const deleteBookingMutation = `
  mutation DeleteBooking($id: Int!) {
    deleteBooking(id: $id)
  }
`;

const createBookingMutation = `
  mutation CreateBooking($input: CreateBookingInput!) {
    createBooking(input: $input) {
      id
      userId
      facilityId
      bookingDate
      startTime
      endTime
      status
      totalPrice
    }
  }
`;

export function setup() {
  const tokens = TEST_USERS.map(user => ({
    userId: user.userId,
    token: getGraphQLToken(GRAPHQL_URL, user.phoneNumber),
  }));
  const adminToken = getGraphQLToken(GRAPHQL_URL, ADMIN_USER.phoneNumber);
  return { tokens , adminToken };
}

export default function (data) {
  const userToken = data.tokens[Math.floor(Math.random() * data.tokens.length)];
  const facilityId = randomFacilityId();
  const bookingDate = generateFutureDate();
  const startHour = Math.floor(Math.random() * (20 - 8) + 8);
  const startTime = `${startHour.toString().padStart(2, '0')}:00:00`;
  const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00:00`;

  const payload = createGraphQLPayload(createBookingMutation, {
    input: {
      userId: userToken.userId,
      facilityId,
      bookingDate,
      startTime: startTime,
      endTime: endTime,
    },
  });

  const res = http.post(GRAPHQL_URL, payload, {
    headers: authHeaders(userToken.token),
  });

  if (res.status !== 200) {
    systemFailureRate.add(1);
    return;
  }

  const body = JSON.parse(res.body);

  if(!body.errors) {
    bookingsCreated.add(1);
    successRate.add(1);
    conflictRate.add(0);

    const bookingId = body.data.createBooking.id;

    const deletePayload = createGraphQLPayload(deleteBookingMutation, {
      id: bookingId,
    });

    const deleteRes = http.post(GRAPHQL_URL, deletePayload, {
      headers: authHeaders(data.adminToken),
    });

    const deleteBody = JSON.parse(deleteRes.body);

    if (deleteRes.status === 200 && !deleteBody.errors) {
      bookingDeleted.add(1);
    } else {
      console.error(`[GQL DELETE FAILED] ID: ${bookingId} | Error: ${JSON.stringify(deleteBody.errors)}`);
    }
  } else {
    const errorCode = body.errors[0]?.extensions?.code;

    if (errorCode === 'BOOKING_CONFLICT') {
      successRate.add(0);
      conflictRate.add(1);
      bookingConflicts.add(1);
      console.log(`[GQL Booking Conflict] User ${userToken.userId} at ${startTime}`);
    } else {
      // Logic failure (Daily Limit, Validation, etc.)
      successRate.add(0);
      conflictRate.add(0);
      systemFailureRate.add(1);
      
      if (__ITER < 50) {
        console.error(`[GQL ERROR] Code: ${errorCode} | Msg: ${body.errors[0].message}`);
      }
    }
  }

  sleep(1 + Math.random() * 2);
}

// ✅ Summary
export function handleSummary(data) {
  return {
    'tests/results/graphql/05-booking-creation.json': JSON.stringify(data, null, 2),
  };
}