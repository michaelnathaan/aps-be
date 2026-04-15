// Scenario 5: Generic REST - Multiple requests (dashboard composed client-side)

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { REST_BASE_URL, LOAD_CONFIGS, THRESHOLDS, TEST_USERS } from '../config/config.js';
import { getRESTToken, authHeaders } from '../utils/auth.js';

const totalResponseSize = new Trend('total_response_size_bytes');
const requestCount = new Trend('requests_per_dashboard');

export const options = {
  stages: LOAD_CONFIGS.read.stages,
  thresholds: THRESHOLDS,
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
  const headers = authHeaders(userToken.token);

  const responses = http.batch([
    ['GET', `${REST_BASE_URL}/users/${userToken.userId}`, null, { headers }],
    ['GET', `${REST_BASE_URL}/users/${userToken.userId}/bookings?limit=10&offset=0`, null, { headers }],
  ]);

  const userRes = responses[0];
  const bookingsRes = responses[1];

  const userOk = check(userRes, {
    'user status 200': (r) => r.status === 200,
    'has user data': (r) => JSON.parse(r.body).id !== undefined,
  });

  const bookingsOk = check(bookingsRes, {
    'bookings status 200': (r) => r.status === 200,
    'has bookings array': (r) => Array.isArray(JSON.parse(r.body)),
  });

  if (userOk && bookingsOk) {
    // Simulate client-side composition
    const user = JSON.parse(userRes.body);
    const bookings = JSON.parse(bookingsRes.body);

    const dashboard = { user, bookings }; // frontend stitches this

    totalResponseSize.add(userRes.body.length + bookingsRes.body.length);
    requestCount.add(2); // always 2 requests for this scenario
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'tests/results/rest/04-generic-nested-query.json': JSON.stringify(data, null, 2),
  };
}