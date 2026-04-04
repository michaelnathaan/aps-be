/**
 * Scenario 4: Nested User Dashboard (GraphQL)
 * Purpose: Test deep data fetching with DataLoader
 * Measures: User dashboard with nested bookings + facilities
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { GRAPHQL_URL, LOAD_CONFIGS, THRESHOLDS, TEST_USERS, createGraphQLPayload } from '../config/graphql.config.js';
import { getGraphQLToken, authHeaders } from '../utils/auth.js';

// Custom metrics
const bookingsCount = new Trend('user_bookings_count');
const responseSize = new Trend('response_size_bytes');

export const options = {
  stages: LOAD_CONFIGS.read.stages,
  thresholds: THRESHOLDS,
};

const query = `
  query GetUserDashboard($userId: Int!, $limit: Int!, $offset: Int!) {
    userDashboard(userId: $userId, limit: $limit, offset: $offset) {
      user {
        id
        fullName
        phoneNumber
        role
        isVerifiedTenant
      }
      bookings {
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
        user {
          id
          fullName
        }
      }
      bookingCountToday
      upcomingBookings
      totalSpent
    }
  }
`;

export function setup() {
  // Get tokens for test users
  const tokens = TEST_USERS.map(user => ({
    userId: user.userId,
    token: getGraphQLToken(GRAPHQL_URL, user.phoneNumber),
  }));
  return { tokens };
}

export default function (data) {
  // Randomly select a user
  const userToken = data.tokens[Math.floor(Math.random() * data.tokens.length)];

  const payload = createGraphQLPayload(query, {
    userId: userToken.userId,
    limit: 10,
    offset: 0,
  });

  const response = http.post(GRAPHQL_URL, payload, {
    headers: authHeaders(userToken.token),
  });

  // Validation
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'no errors': (r) => !JSON.parse(r.body).errors,
    'has dashboard': (r) => JSON.parse(r.body).data.userDashboard !== null,
    'has user': (r) => JSON.parse(r.body).data.userDashboard.user !== null,
    'has bookings': (r) => Array.isArray(JSON.parse(r.body).data.userDashboard.bookings),
  });

  if (success) {
    const body = JSON.parse(response.body);
    const dashboard = body.data.userDashboard;
    bookingsCount.add(dashboard.bookings.length);
    responseSize.add(response.body.length);
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'tests/results/graphql/04-nested-dashboard.json': JSON.stringify(data, null, 2),
  };
}