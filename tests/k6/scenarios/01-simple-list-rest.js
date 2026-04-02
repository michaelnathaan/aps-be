/**
 * Scenario 1: Simple List Query (REST)
 * Purpose: Baseline performance measurement
 * Measures: Facility listing without complex joins
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { REST_BASE_URL, LOAD_CONFIGS, THRESHOLDS, HTTP_OPTIONS } from '../config/rest.config.js';

// Custom metrics
const facilityCount = new Counter('facility_count');
const responseSize = new Trend('response_size_bytes');

export const options = {
  stages: LOAD_CONFIGS.read.stages,
  thresholds: THRESHOLDS,
};

export default function () {
  const response = http.get(`${REST_BASE_URL}/facilities`, HTTP_OPTIONS);
  
  // Validation
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response is array': (r) => Array.isArray(JSON.parse(r.body)),
    'has facilities': (r) => JSON.parse(r.body).length > 0,
  });
  
  if (success) {
    const facilities = JSON.parse(response.body);
    facilityCount.add(facilities.length);
    responseSize.add(response.body.length);
  }
  
  sleep(1);
}

export function handleSummary(data) {
  return {
    'tests/results/rest/01-simple-list.json': JSON.stringify(data, null, 2),
  };
}