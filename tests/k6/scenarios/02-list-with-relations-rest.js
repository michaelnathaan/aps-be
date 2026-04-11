/**
 * Scenario 2: List with Relational Data (REST)
 * Purpose: Test N+1 query handling with JOINs
 * Measures: User bookings with nested facility and user data
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { REST_BASE_URL, LOAD_CONFIGS, THRESHOLDS, TEST_USERS } from '../config/rest.config.js';
import { getRESTToken, authHeaders } from '../utils/auth.js';

const bookingsRetrieved = new Counter('bookings_retrieved');
const responseSize = new Trend('response_size_bytes');
const nestedObjects = new Trend('nested_objects_count');

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
  
  const response = http.get(
    `${REST_BASE_URL}/users/${userToken.userId}/bookings?limit=10&offset=0`,
    { headers: authHeaders(userToken.token) }
  );

  const safeParse = (body) => {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  };
  
  const body = safeParse(response.body);
  // const success = check(response, {
  //   'status is 200': (r) => r.status === 200,
  //   'is array': (r) => Array.isArray(JSON.parse(r.body)),
  //   'has nested user': (r) => {
  //     const bookings = JSON.parse(r.body);
  //     return bookings.length === 0 || bookings[0].user !== undefined;
  //   },
  //   'has nested facility': (r) => {
  //     const bookings = JSON.parse(r.body);
  //     return bookings.length === 0 || bookings[0].facility !== undefined;
  //   },
  // });

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'valid JSON': () => body !== null,
    'is array': () => Array.isArray(body),
    'has nested user': () => body.length === 0 || body[0].user !== undefined,
    'has nested facility': () => body.length === 0 || body[0].facility !== undefined,
  });
  
  if (success) {
    const bookings = JSON.parse(response.body);
    bookingsRetrieved.add(bookings.length);
    responseSize.add(response.body.length);
    
    nestedObjects.add(bookings.length * 2);
  }
  
  sleep(1);
}

export function handleSummary(data) {
  return {
    'tests/results/rest/02-list-with-relations.json': JSON.stringify(data, null, 2),
  };
}