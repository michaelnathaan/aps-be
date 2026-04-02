/**
 * GraphQL API Configuration for k6 Load Testing
 * Identical load patterns to REST for fair comparison
 */

export const GRAPHQL_URL = __ENV.GRAPHQL_URL || 'http://localhost:3002/graphql';

// Same test users as REST
export const TEST_USERS = [
  { phoneNumber: '+6281234567892', role: 'tenant', userId: 3 },
  { phoneNumber: '+6281234567812', role: 'guest', userId: 23 },
  { phoneNumber: '+6281234567893', role: 'tenant', userId: 4 },
  { phoneNumber: '+6281234567894', role: 'tenant', userId: 5 },
];

// Identical load configurations
export const LOAD_CONFIGS = {
  read: {
    stages: [
      { duration: '30s', target: 10 },
      { duration: '1m', target: 25 },
      { duration: '2m', target: 50 },
      { duration: '1m', target: 100 },
      { duration: '30s', target: 0 },
    ],
  },
  write: {
    stages: [
      { duration: '30s', target: 5 },
      { duration: '1m', target: 10 },
      { duration: '2m', target: 20 },
      { duration: '1m', target: 30 },
      { duration: '30s', target: 0 },
    ],
  },
  mixed: {
    stages: [
      { duration: '30s', target: 10 },
      { duration: '1m', target: 25 },
      { duration: '2m', target: 50 },
      { duration: '1m', target: 75 },
      { duration: '30s', target: 0 },
    ],
  },
};

// Same thresholds as REST
export const THRESHOLDS = {
  'http_req_duration': ['p(50)<500', 'p(95)<1000', 'p(99)<2000'],
  'http_reqs': ['rate>30'],  // At least 30 req/sec
  'http_req_failed': ['rate<0.01'],
  'checks': ['rate>0.99'],
};

// GraphQL-specific HTTP options
export const HTTP_OPTIONS = {
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: '30s',
};

// Helper to create GraphQL request payload
export function createGraphQLPayload(query, variables = {}) {
  return JSON.stringify({
    query: query,
    variables: variables,
  });
}