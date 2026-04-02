/**
 * Scenario 2: List with Relational Data (GraphQL)
 * Purpose: Test N+1 query handling with DataLoader
 * Measures: User bookings with nested facility and user data
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { GRAPHQL_URL, LOAD_CONFIGS, THRESHOLDS, TEST_USERS, createGraphQLPayload } from '../config/graphql.config.js';
import { getGraphQLToken, authHeaders } from '../utils/auth.js';

// Custom metrics
const bookingsRetrieved = new Counter('bookings_retrieved');
const responseSize = new Trend('response_size_bytes');
const nestedObjects = new Trend('nested_objects_count');

export const options = {
  stages: LOAD_CONFIGS.read.stages,
  thresholds: THRESHOLDS,
};

const query = `
  query GetUserBookings($userId: Int!) {
    userBookings(userId: $userId) {
      id
      bookingDate
      startTime
      endTime
      status
      totalPrice
      user {
        id
        fullName
        phoneNumber
        role
      }
      facility {
        id
        name
        description
        pricePerHour
        openTime
        closeTime
      }
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
  
  const payload = createGraphQLPayload(query, {
    userId: userToken.userId,
  });
  
  const response = http.post(GRAPHQL_URL, payload, {
    headers: authHeaders(userToken.token),
  });
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'no errors': (r) => !JSON.parse(r.body).errors,
    'is array': (r) => Array.isArray(JSON.parse(r.body).data.userBookings),
    'has nested user': (r) => {
      const bookings = JSON.parse(r.body).data.userBookings;
      return bookings.length === 0 || bookings[0].user !== null;
    },
    'has nested facility': (r) => {
      const bookings = JSON.parse(r.body).data.userBookings;
      return bookings.length === 0 || bookings[0].facility !== null;
    },
  });
  
  if (success) {
    const bookings = JSON.parse(response.body).data.userBookings;
    bookingsRetrieved.add(bookings.length);
    responseSize.add(response.body.length);
    nestedObjects.add(bookings.length * 2);
  }
  
  sleep(1);
}

export function handleSummary(data) {
  return {
    'results/graphql/02-list-with-relations.json': JSON.stringify(data, null, 2),
  };
}