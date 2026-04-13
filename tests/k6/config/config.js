/**
 * GraphQL API Configuration for k6 Load Testing
 * Identical load patterns to REST for fair comparison
 */

export const GRAPHQL_URL = __ENV.GRAPHQL_URL || 'http://localhost:3002/graphql';
export const REST_BASE_URL = __ENV.REST_URL || 'http://localhost:3001/api';

// Test user credentials (from seed data)
export const TEST_USERS = [
  { phoneNumber: '+6281234567892', role: 'tenant', userId: 3 },
  { phoneNumber: '+6281234567893', role: 'tenant', userId: 4 },
  { phoneNumber: '+6281234567894', role: 'tenant', userId: 5 },
  { phoneNumber: '+6281234567895', role: 'tenant', userId: 6 },
  { phoneNumber: '+6281234567896', role: 'tenant', userId: 7 },
  { phoneNumber: '+6281234567897', role: 'tenant', userId: 8 },
  { phoneNumber: '+6281234567898', role: 'tenant', userId: 9 },
  { phoneNumber: '+6281234567899', role: 'tenant', userId: 10 },
  { phoneNumber: '+6281234567800', role: 'tenant', userId: 11 },
  { phoneNumber: '+6281234567801', role: 'tenant', userId: 12 },
  { phoneNumber: '+6281234567802', role: 'tenant', userId: 13 },
  { phoneNumber: '+6281234567803', role: 'tenant', userId: 14 },
  { phoneNumber: '+6281234567804', role: 'tenant', userId: 15 },
  { phoneNumber: '+6281234567805', role: 'tenant', userId: 16 },
  { phoneNumber: '+6281234567806', role: 'tenant', userId: 17 },
  { phoneNumber: '+6281234567807', role: 'tenant', userId: 18 },
  { phoneNumber: '+6281234567808', role: 'tenant', userId: 19 },
  { phoneNumber: '+6281234567809', role: 'tenant', userId: 20 },
  { phoneNumber: '+6281234567810', role: 'tenant', userId: 21 },
  { phoneNumber: '+6281234567811', role: 'tenant', userId: 22 },
  { phoneNumber: '+6281234567812', role: 'guest', userId: 23 },
  { phoneNumber: '+6281234567813', role: 'guest', userId: 24 },
  { phoneNumber: '+6281234567814', role: 'guest', userId: 25 },
  { phoneNumber: '+6281234567815', role: 'guest', userId: 26 },
  { phoneNumber: '+6281234567816', role: 'guest', userId: 27 },
  { phoneNumber: '+6281234567817', role: 'guest', userId: 28 },
  { phoneNumber: '+6281234567818', role: 'guest', userId: 29 },
  { phoneNumber: '+6281234567819', role: 'guest', userId: 30 },
  { phoneNumber: '+6281234567820', role: 'guest', userId: 31 },
  { phoneNumber: '+6281234567821', role: 'guest', userId: 32 },
  { phoneNumber: '+6289100000001', role: 'tenant', userId: 33 },
  { phoneNumber: '+6289100000002', role: 'tenant', userId: 34 },
  { phoneNumber: '+6289100000003', role: 'tenant', userId: 35 },
  { phoneNumber: '+6289100000004', role: 'tenant', userId: 36 },
  { phoneNumber: '+6289100000005', role: 'tenant', userId: 37 },
  { phoneNumber: '+6289100000006', role: 'tenant', userId: 38 },
  { phoneNumber: '+6289100000007', role: 'tenant', userId: 39 },
  { phoneNumber: '+6289100000008', role: 'tenant', userId: 40 },
  { phoneNumber: '+6289100000009', role: 'tenant', userId: 41 },
  { phoneNumber: '+6289100000010', role: 'tenant', userId: 42 },
  { phoneNumber: '+6289100000011', role: 'tenant', userId: 43 },
  { phoneNumber: '+6289100000012', role: 'tenant', userId: 44 },
  { phoneNumber: '+6289100000013', role: 'tenant', userId: 45 },
  { phoneNumber: '+6289100000014', role: 'tenant', userId: 46 },
  { phoneNumber: '+6289100000015', role: 'tenant', userId: 47 },
  { phoneNumber: '+6289100000016', role: 'tenant', userId: 48 },
  { phoneNumber: '+6289100000017', role: 'tenant', userId: 49 },
  { phoneNumber: '+6289100000018', role: 'tenant', userId: 50 },
  { phoneNumber: '+6289100000019', role: 'tenant', userId: 51 },
  { phoneNumber: '+6289100000020', role: 'tenant', userId: 52 },
  { phoneNumber: '+6289100000021', role: 'tenant', userId: 53 },
  { phoneNumber: '+6289100000022', role: 'tenant', userId: 54 },
  { phoneNumber: '+6289100000023', role: 'tenant', userId: 55 },
  { phoneNumber: '+6289100000024', role: 'tenant', userId: 56 },
  { phoneNumber: '+6289100000025', role: 'tenant', userId: 57 },
  { phoneNumber: '+6289100000026', role: 'tenant', userId: 58 },
  { phoneNumber: '+6289100000027', role: 'tenant', userId: 59 },
  { phoneNumber: '+6289100000028', role: 'tenant', userId: 60 },
  { phoneNumber: '+6289100000029', role: 'tenant', userId: 61 },
  { phoneNumber: '+6289100000030', role: 'tenant', userId: 62 },
  { phoneNumber: '+6289100000031', role: 'tenant', userId: 63 },
  { phoneNumber: '+6289100000032', role: 'tenant', userId: 64 },
  { phoneNumber: '+6289100000033', role: 'tenant', userId: 65 },
  { phoneNumber: '+6289100000034', role: 'tenant', userId: 66 },
  { phoneNumber: '+6289100000035', role: 'tenant', userId: 67 },
  { phoneNumber: '+6289100000036', role: 'tenant', userId: 68 },
  { phoneNumber: '+6289100000037', role: 'tenant', userId: 69 },
  { phoneNumber: '+6289100000038', role: 'tenant', userId: 70 },
  { phoneNumber: '+6289100000039', role: 'tenant', userId: 71 },
  { phoneNumber: '+6289100000040', role: 'tenant', userId: 72 },
  { phoneNumber: '+6289100000041', role: 'tenant', userId: 73 },
  { phoneNumber: '+6289100000042', role: 'tenant', userId: 74 },
  { phoneNumber: '+6289100000043', role: 'tenant', userId: 75 },
  { phoneNumber: '+6289100000044', role: 'tenant', userId: 76 },
  { phoneNumber: '+6289100000045', role: 'tenant', userId: 77 },
  { phoneNumber: '+6289100000046', role: 'tenant', userId: 78 },
  { phoneNumber: '+6289100000047', role: 'tenant', userId: 79 },
  { phoneNumber: '+6289100000048', role: 'tenant', userId: 80 },
  { phoneNumber: '+6289100000049', role: 'tenant', userId: 81 },
  { phoneNumber: '+6289100000050', role: 'tenant', userId: 82 },
  { phoneNumber: '+6289100000051', role: 'tenant', userId: 83 },
  { phoneNumber: '+6289100000052', role: 'tenant', userId: 84 },
  { phoneNumber: '+6289100000053', role: 'tenant', userId: 85 },
  { phoneNumber: '+6289100000054', role: 'tenant', userId: 86 },
  { phoneNumber: '+6289100000055', role: 'tenant', userId: 87 },
  { phoneNumber: '+6289100000056', role: 'tenant', userId: 88 },
  { phoneNumber: '+6289100000057', role: 'tenant', userId: 89 },
  { phoneNumber: '+6289100000058', role: 'tenant', userId: 90 },
  { phoneNumber: '+6289100000059', role: 'tenant', userId: 91 },
  { phoneNumber: '+6289100000060', role: 'tenant', userId: 92 },
  { phoneNumber: '+6289100000061', role: 'tenant', userId: 93 },
  { phoneNumber: '+6289100000062', role: 'tenant', userId: 94 },
  { phoneNumber: '+6289100000063', role: 'tenant', userId: 95 },
  { phoneNumber: '+6289100000064', role: 'tenant', userId: 96 },
  { phoneNumber: '+6289100000065', role: 'tenant', userId: 97 },
  { phoneNumber: '+6289100000066', role: 'tenant', userId: 98 },
  { phoneNumber: '+6289100000067', role: 'tenant', userId: 99 },
  { phoneNumber: '+6289100000068', role: 'tenant', userId: 100 },
  { phoneNumber: '+6289100000069', role: 'tenant', userId: 101 },
  { phoneNumber: '+6289100000070', role: 'tenant', userId: 102 },
  { phoneNumber: '+6281234567933', role: 'guest', userId: 103 },
  { phoneNumber: '+6281234567934', role: 'guest', userId: 104 },
  { phoneNumber: '+6281234567935', role: 'guest', userId: 105 },
  { phoneNumber: '+6281234567936', role: 'guest', userId: 106 },
  { phoneNumber: '+6281234567937', role: 'guest', userId: 107 },
  { phoneNumber: '+6281234567938', role: 'guest', userId: 108 },
  { phoneNumber: '+6281234567939', role: 'guest', userId: 109 },
  { phoneNumber: '+6281234567940', role: 'guest', userId: 110 },
  { phoneNumber: '+6281234567941', role: 'guest', userId: 111 },
  { phoneNumber: '+6281234567942', role: 'guest', userId: 112 },
  { phoneNumber: '+6281234567943', role: 'guest', userId: 113 },
  { phoneNumber: '+6281234567944', role: 'guest', userId: 114 },
  { phoneNumber: '+6281234567945', role: 'guest', userId: 115 },
  { phoneNumber: '+6281234567946', role: 'guest', userId: 116 },
  { phoneNumber: '+6281234567947', role: 'guest', userId: 117 },
  { phoneNumber: '+6281234567948', role: 'guest', userId: 118 },
  { phoneNumber: '+6281234567949', role: 'guest', userId: 119 },
  { phoneNumber: '+6281234567950', role: 'guest', userId: 120 },
  { phoneNumber: '+6281234567951', role: 'guest', userId: 121 },
  { phoneNumber: '+6281234567952', role: 'guest', userId: 122 },
  { phoneNumber: '+6281234567953', role: 'guest', userId: 123 },
  { phoneNumber: '+6281234567954', role: 'guest', userId: 124 },
  { phoneNumber: '+6281234567955', role: 'guest', userId: 125 },
  { phoneNumber: '+6281234567956', role: 'guest', userId: 126 },
  { phoneNumber: '+6281234567957', role: 'guest', userId: 127 },
  { phoneNumber: '+6281234567958', role: 'guest', userId: 128 },
  { phoneNumber: '+6281234567959', role: 'guest', userId: 129 },
  { phoneNumber: '+6281234567960', role: 'guest', userId: 130 },
  { phoneNumber: '+6281234567961', role: 'guest', userId: 131 },
  { phoneNumber: '+6281234567962', role: 'guest', userId: 132 },
];

export const ADMIN_USER = { phoneNumber: '+6281234567891', role: 'admin', userId: 2 }; 
// Load test configurations (as per research paper)
export const LOAD_CONFIGS = {
  // Scenario 1-4: Read operations
  read: {
    stages: [
      { duration: '1m', target: 100 },  // 1. WARM-UP: Get to 100 VUs
      { duration: '3m', target: 100 },  // 2. PLATEAU: Sustained 100 VU Stress
      { duration: '1m', target: 0 },    // 3. COOL-DOWN: Let the server recover
    ],
  },

  // Scenario 5: Write operations (lower load to prevent conflicts)
  write: {
    stages: [
      { duration: '1m', target: 100 },  // 1. WARM-UP: Get to 100 VUs
      { duration: '3m', target: 100 },  // 2. PLATEAU: Sustained 100 VU Stress
      { duration: '1m', target: 0 },    // 3. COOL-DOWN: Let the server recover
    ],
  },

  // Scenario 6: Mixed workload
  mixed: {
    stages: [
      { duration: '1m', target: 100 },  // 1. WARM-UP: Get to 100 VUs
      { duration: '3m', target: 100 },  // 2. PLATEAU: Sustained 100 VU Stress
      { duration: '1m', target: 0 },    // 3. COOL-DOWN: Let the server recover
    ],
  },
};

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