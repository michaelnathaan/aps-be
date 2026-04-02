/**
 * Scenario 5: Booking Creation (GraphQL)
 * Purpose: Test write operations and conflict detection
 * Now aligned with REST flow:
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
  createGraphQLPayload
} from '../config/graphql.config.js';
import { getGraphQLToken, authHeaders } from '../utils/auth.js';
import { randomFacilityId, generateFutureDate } from '../utils/data.js';

// ✅ Metrics (aligned with REST)
const successRate = new Rate('booking_success');
const conflictRate = new Rate('booking_conflict');
const systemFailureRate = new Rate('system_failure');

const bookingsCreated = new Counter('bookings_created');
const bookingConflicts = new Counter('booking_conflicts');

// ✅ Options
export const options = {
  stages: LOAD_CONFIGS.write.stages,
  thresholds: {
    http_req_duration: ['p(95)<1000'],

    booking_success: ['rate>0.70'],
    booking_conflict: ['rate<0.25'],
    http_req_failed: ['rate<0.05'],
  },
};

// ✅ Queries & Mutations
const getSlotsQuery = `
  query GetAvailableSlots($input: SlotAvailabilityInput!) {
    availableSlots(input: $input) {
      facilityId
      date
      slots {
        startTime
        endTime
        isAvailable
      }
    }
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

// ✅ Setup
export function setup() {
  const tokens = TEST_USERS.map(user => ({
    userId: user.userId,
    token: getGraphQLToken(GRAPHQL_URL, user.phoneNumber),
  }));
  return { tokens };
}

// ✅ Main Test
export default function (data) {
  const userToken = data.tokens[Math.floor(Math.random() * data.tokens.length)];
  const facilityId = randomFacilityId();
  const bookingDate = generateFutureDate();

  // =========================
  // STEP 1: Get Available Slots
  // =========================
  const slotPayload = createGraphQLPayload(getSlotsQuery, {
    input: {
      facilityId,
      date: bookingDate,
    },
  });

  const slotRes = http.post(GRAPHQL_URL, slotPayload, {
    headers: authHeaders(userToken.token),
  });

  if (slotRes.status !== 200) {
    systemFailureRate.add(1);
    return;
  }

  let slotsData;

  try {
    slotsData = JSON.parse(slotRes.body);
  } catch (e) {
    console.error(`[SLOT PARSE ERROR]
body=${slotRes.body}`);
    systemFailureRate.add(1);
    return;
  }

  const availableSlots =
    slotsData?.data?.availableSlots?.slots?.filter(s => s.isAvailable) || [];

  if (availableSlots.length === 0) {
    return; // same behavior as REST
  }

  const slot = availableSlots[Math.floor(Math.random() * availableSlots.length)];

  // =========================
  // STEP 2: Create Booking
  // =========================
  const payload = createGraphQLPayload(createBookingMutation, {
    input: {
      userId: userToken.userId,
      facilityId,
      bookingDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
    },
  });

  const res = http.post(GRAPHQL_URL, payload, {
    headers: authHeaders(userToken.token),
  });

  if (res.status !== 200) {
    systemFailureRate.add(1);
    return;
  }

  let body;

  try {
    body = JSON.parse(res.body);
  } catch (e) {
    console.error(`[BOOKING PARSE ERROR]
body=${res.body}`);
    systemFailureRate.add(1);
    return;
  }

  // =========================
  // STEP 3: Handle Result
  // =========================
  if (!body.errors) {
    successRate.add(1);
    conflictRate.add(0);
    systemFailureRate.add(0);
    bookingsCreated.add(1);

  } else {
    const errorCode = body.errors[0]?.extensions?.code;

    if (errorCode === 'BOOKING_CONFLICT') {
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

  // ✅ Match REST pacing
  sleep(1 + Math.random() * 2);
}

// ✅ Summary
export function handleSummary(data) {
  return {
    'tests/results/graphql/05-booking-creation.json': JSON.stringify(data, null, 2),
  };
}