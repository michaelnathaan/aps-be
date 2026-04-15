/**
 * Scenario 6: Mixed Read-Write Workload (GraphQL)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';
import { GRAPHQL_URL, LOAD_CONFIGS, TEST_USERS, createGraphQLPayload } from '../../config/config.js';
import { getGraphQLToken, authHeaders } from '../../utils/auth.js';
import { randomFacilityId, getTomorrowDate } from '../../utils/data.js';

// ===== Metrics =====
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

// ===== Queries =====
const facilitiesQuery = `
  query GetFacilities {
    facilities {
      id
      name
      description
      pricePerHour
      openTime
      closeTime
    }
  }
`;

const facilityQuery = `
  query GetFacility($id: Int!) {
    facility(id: $id) {
      id
      name
      description
      pricePerHour
      openTime
      closeTime
      isActive
    }
  }
`;

const slotsQuery = `
  query GetSlots($facilityId: Int!, $date: String!) {
    availableSlots(input: { facilityId: $facilityId, date: $date }) {
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
      bookingDate
      startTime
      endTime
      status
    }
  }
`;

// ===== Setup =====
export function setup() {
  const tokens = TEST_USERS.map(user => ({
    userId: user.userId,
    token: getGraphQLToken(GRAPHQL_URL, user.phoneNumber),
  }));
  return { tokens };
}

// ===== Helper: detect conflict =====
function isConflictError(errors) {
  if (!errors) return false;
  return errors.some(e =>
    e.message?.toLowerCase().includes('conflict') ||
    e.message?.toLowerCase().includes('already booked')
  );
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
      const payload = createGraphQLPayload(facilitiesQuery);
      response = http.post(GRAPHQL_URL, payload, {
        headers: authHeaders(userToken.token),
      });
      check(response, { 'browsing: facilities list': (r) => r.status === 200 });
    } else {
      const facilityId = randomFacilityId();
      const payload = createGraphQLPayload(facilityQuery, { id: facilityId });
      response = http.post(GRAPHQL_URL, payload, {
        headers: authHeaders(userToken.token),
      });
      check(response, { 'browsing: facility details': (r) => r.status === 200 });
    }

    const body = JSON.parse(response.body);

    if (response.status !== 200 || body.errors) {
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

    const payload = createGraphQLPayload(slotsQuery, { facilityId, date });

    const response = http.post(GRAPHQL_URL, payload, {
      headers: authHeaders(userToken.token),
    });

    check(response, { 'availability: slots check': (r) => r.status === 200 });

    let body = {};
    try {
      body = JSON.parse(response.body);
    } catch (e) {
      systemFailureRate.add(1);
      return;
    }

    if (response.status !== 200 || body.errors) {
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

    const slotsPayload = createGraphQLPayload(slotsQuery, { facilityId, date });

    const availabilityRes = http.post(GRAPHQL_URL, slotsPayload, {
      headers: authHeaders(userToken.token),
    });

    let slotsBody = {};
    try {
      slotsBody = JSON.parse(availabilityRes.body);
    } catch (e) {
      systemFailureRate.add(1);
      return;
    }

    if (availabilityRes.status !== 200 || slotsBody.errors) {
      systemFailureRate.add(1);
      return;
    }

    const slots = slotsBody.data?.availableSlots?.slots || [];
    const availableSlots = slots.filter(s => s.isAvailable);

    if (availableSlots.length === 0) return;

    const slot = availableSlots[Math.floor(Math.random() * availableSlots.length)];

    const payload = createGraphQLPayload(createBookingMutation, {
      input: {
        userId: userToken.userId,
        facilityId,
        bookingDate: date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
    });

    const response = http.post(GRAPHQL_URL, payload, {
      headers: authHeaders(userToken.token),
    });

    bookingRequests.add(1);

    let body = {};
    try {
      body = JSON.parse(response.body);
    } catch (e) {
      systemFailureRate.add(1);
      return;
    }

    if (response.status === 200 && !body.errors) {
      successRate.add(1);
      conflictRate.add(0);
      systemFailureRate.add(0);
      successfulBookings.add(1);

    } else if (isConflictError(body.errors)) {
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
    'tests/results/graphql/06-mixed-workload.json': JSON.stringify(data, null, 2),
  };
}