// Scenario 5: Generic GraphQL - One request, generic queries composed via aliases

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { GRAPHQL_URL, LOAD_CONFIGS, THRESHOLDS, TEST_USERS, createGraphQLPayload } from '../config/config.js';
import { getGraphQLToken, authHeaders } from '../utils/auth.js';

const totalResponseSize = new Trend('total_response_size_bytes');
const requestCount = new Trend('requests_per_dashboard');

export const options = {
  stages: LOAD_CONFIGS.read.stages,
  thresholds: THRESHOLDS,
};

// Generic queries composed together — no dedicated userDashboard resolver needed
const query = `
  query GetDashboardGeneric($userId: Int!, $limit: Int!, $offset: Int!) {
    user(id: $userId) {
      id
      fullName
      phoneNumber
      role
      isVerifiedTenant
    }
    userBookingsGeneric(userId: $userId, limit: $limit, offset: $offset) {
      id
      bookingDate
      startTime
      endTime
      status
      totalPrice
      facility {
        id
        name
        pricePerHour
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
    limit: 10,
    offset: 0,
  });

  const response = http.post(GRAPHQL_URL, payload, {
    headers: authHeaders(userToken.token),
  });

  const body = JSON.parse(response.body);

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'no errors': () => !body.errors,
    'has user': () => body.data?.user !== null,
    'has bookings': () => Array.isArray(body.data?.userBookingsGeneric),
  });

  if (success) {
    totalResponseSize.add(response.body.length);
    requestCount.add(1); // one network round-trip for equivalent data
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'tests/results/graphql/04-generic-nested-query.json': JSON.stringify(data, null, 2),
  };
}