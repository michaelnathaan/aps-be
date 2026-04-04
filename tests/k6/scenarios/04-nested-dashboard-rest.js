/**
 * Scenario 4: Nested User Dashboard (REST)
 * Purpose: Test deep data fetching with JOINs
 * Measures: User dashboard with nested bookings + facilities
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { REST_BASE_URL, LOAD_CONFIGS, THRESHOLDS, TEST_USERS } from '../config/rest.config.js';
import { getRESTToken, authHeaders } from '../utils/auth.js';

// Custom metrics
const bookingsCount = new Trend('user_bookings_count');
const responseSize = new Trend('response_size_bytes');

export const options = {
  stages: LOAD_CONFIGS.read.stages,
  thresholds: THRESHOLDS,
};

export function setup() {
  // Get tokens for test users
  const tokens = TEST_USERS.map(user => ({
    userId: user.userId,
    token: getRESTToken(REST_BASE_URL, user.phoneNumber),
  }));
  return { tokens };
}

export default function (data) {
  // Randomly select a user
  const userToken = data.tokens[Math.floor(Math.random() * data.tokens.length)];
  
  // Get user dashboard (includes user + bookings + stats)
  const response = http.get(
    `${REST_BASE_URL}/users/${userToken.userId}/dashboard?limit=10&offset=0`,
    { headers: authHeaders(userToken.token) }
  );
  
  // Validation
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'has user': (r) => JSON.parse(r.body).user !== undefined,
    'has bookings': (r) => Array.isArray(JSON.parse(r.body).bookings),
    'has statistics': (r) => JSON.parse(r.body).bookingCountToday !== undefined,
  });
  
  if (success) {
    const dashboard = JSON.parse(response.body);
    bookingsCount.add(dashboard.bookings.length);
    responseSize.add(response.body.length);
  }
  
  sleep(1);
}

export function handleSummary(data) {
  return {
    'tests/results/rest/04-nested-dashboard.json': JSON.stringify(data, null, 2),
  };
}