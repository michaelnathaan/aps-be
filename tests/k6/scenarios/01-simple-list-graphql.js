/**
 * Scenario 1: Simple List Query (GraphQL)
 * Purpose: Baseline performance measurement
 * Measures: Facility listing without complex joins
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { GRAPHQL_URL, LOAD_CONFIGS, THRESHOLDS, createGraphQLPayload } from '../config/config.js';

// Custom metrics
const facilityCount = new Counter('facility_count');
const responseSize = new Trend('response_size_bytes');

export const options = {
  stages: LOAD_CONFIGS.read.stages,
  thresholds: THRESHOLDS,
};

const query = `
  query GetFacilities {
    facilities {
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

export default function () {
  const payload = createGraphQLPayload(query);

  const response = http.post(GRAPHQL_URL, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  // Validation
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'no errors': (r) => !JSON.parse(r.body).errors,
    'has facilities': (r) => JSON.parse(r.body).data.facilities.length > 0,
  });

  if (success) {
    const body = JSON.parse(response.body);
    const facilities = body.data.facilities;
    facilityCount.add(facilities.length);
    responseSize.add(response.body.length);
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'tests/results/graphql/01-simple-list.json': JSON.stringify(data, null, 2),
  };
}