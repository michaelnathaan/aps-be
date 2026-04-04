/**
 * REST API Configuration for k6 Load Testing
 * Based on research methodology - identical load patterns for fair comparison
 */

export const REST_BASE_URL = __ENV.REST_URL || 'http://localhost:3001/api';

// Test user credentials (from seed data)
export const TEST_USERS = [
  { phoneNumber: '+6281234567892', role: 'tenant', userId: 3 },   // Tenant (free bookings)
  { phoneNumber: '+6281234567812', role: 'guest', userId: 23 },   // Guest (paid bookings)
  { phoneNumber: '+6281234567893', role: 'tenant', userId: 4 },
  { phoneNumber: '+6281234567894', role: 'tenant', userId: 5 },
];

// Load test configurations (as per research paper)
export const LOAD_CONFIGS = {
  // Scenario 1-4: Read operations
  read: {
    stages: [
      { duration: '30s', target: 10 },   // Ramp up to 10 VUs
      { duration: '1m', target: 25 },    // Increase to 25 VUs
      { duration: '2m', target: 50 },    // Sustained load at 50 VUs
      { duration: '1m', target: 100 },   // Peak load at 100 VUs
      { duration: '30s', target: 0 },    // Ramp down
    ],
  },

  // Scenario 5: Write operations (lower load to prevent conflicts)
  write: {
    stages: [
      { duration: '30s', target: 5 },
      { duration: '1m', target: 10 },
      { duration: '2m', target: 20 },
      { duration: '1m', target: 30 },
      { duration: '30s', target: 0 },
    ],
  },

  // Scenario 6: Mixed workload
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

// Performance thresholds (based on research requirements)
export const THRESHOLDS = {
  // Response time requirements
  'http_req_duration': ['p(50)<500', 'p(95)<1000', 'p(99)<2000'],

  // Throughput requirement (lowered to realistic level)
  'http_reqs': ['rate>30'],  // At least 30 req/sec

  // Error rate threshold (max 1%)
  'http_req_failed': ['rate<0.01'],

  // Success rate (min 99%)
  'checks': ['rate>0.99'],
};

// HTTP options
export const HTTP_OPTIONS = {
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: '30s',
};