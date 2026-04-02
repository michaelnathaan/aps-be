/**
 * Scenario 6: Mixed Read-Write Workload (GraphQL)
 * Purpose: Simulate realistic user behavior
 * Distribution: 70% browsing, 20% availability checks, 10% booking creation
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { GRAPHQL_URL, LOAD_CONFIGS, TEST_USERS, createGraphQLPayload } from '../config/graphql.config.js';
import { getGraphQLToken, authHeaders } from '../utils/auth.js';
import { randomFacilityId, getTomorrowDate, generateTimeSlot } from '../utils/data.js';

// Custom metrics
const browsingRequests = new Counter('browsing_requests');
const availabilityRequests = new Counter('availability_requests');
const bookingRequests = new Counter('booking_requests');
const successfulBookings = new Counter('successful_bookings');

export const options = {
  stages: LOAD_CONFIGS.mixed.stages,
  thresholds: {
    'http_req_duration': ['p(95)<800'],
    'http_req_failed': ['rate<0.05'],
  },
};

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

export function setup() {
  const tokens = TEST_USERS.map(user => ({
    userId: user.userId,
    token: getGraphQLToken(GRAPHQL_URL, user.phoneNumber),
  }));
  return { tokens };
}

export default function (data) {
  const userToken = data.tokens[Math.floor(Math.random() * data.tokens.length)];
  const random = Math.random();
  
  if (random < 0.7) {
    // 70% - Browsing
    if (Math.random() < 0.5) {
      // List all facilities
      const payload = createGraphQLPayload(facilitiesQuery);
      const response = http.post(GRAPHQL_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      check(response, { 'browsing: facilities list': (r) => r.status === 200 });
      browsingRequests.add(1);
    } else {
      // Get specific facility
      const facilityId = randomFacilityId();
      const payload = createGraphQLPayload(facilityQuery, { id: facilityId });
      const response = http.post(GRAPHQL_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      check(response, { 'browsing: facility details': (r) => r.status === 200 });
      browsingRequests.add(1);
    }
  } else if (random < 0.9) {
    // 20% - Check slot availability
    const facilityId = randomFacilityId();
    const date = getTomorrowDate();
    const payload = createGraphQLPayload(slotsQuery, {
      facilityId: facilityId,
      date: date,
    });
    const response = http.post(GRAPHQL_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    check(response, { 'availability: slots check': (r) => r.status === 200 });
    availabilityRequests.add(1);
  } else {
    // 10% - Create booking
    const facilityId = randomFacilityId();
    const timeSlot = generateTimeSlot();
    
    const payload = createGraphQLPayload(createBookingMutation, {
      input: {
        userId: userToken.userId,
        facilityId: facilityId,
        bookingDate: getTomorrowDate(),
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
      },
    });
    
    const response = http.post(GRAPHQL_URL, payload, {
      headers: authHeaders(userToken.token),
    });
    
    bookingRequests.add(1);
    const body = JSON.parse(response.body);
    if (response.status === 200 && !body.errors) {
      successfulBookings.add(1);
    }
  }
  
  sleep(Math.random() * 2 + 1); // 1-3 seconds between requests
}

export function handleSummary(data) {
  return {
    'results/graphql/06-mixed-workload.json': JSON.stringify(data, null, 2),
  };
}