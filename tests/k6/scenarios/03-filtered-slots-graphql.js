/**
 * Scenario 3: Filtered Slot Availability (GraphQL)
 * Purpose: Test parameter handling and date filtering
 * Measures: availableSlots query performance
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { GRAPHQL_URL, LOAD_CONFIGS, THRESHOLDS, createGraphQLPayload } from '../config/graphql.config.js';
import { randomFacilityId, getTomorrowDate } from '../utils/data.js';

// Custom metrics
const availableSlots = new Counter('available_slots_count');
const bookedSlots = new Counter('booked_slots_count');
const responseSize = new Trend('response_size_bytes');

export const options = {
  stages: LOAD_CONFIGS.read.stages,
  thresholds: THRESHOLDS,
};

const query = `
  query GetAvailableSlots($facilityId: Int!, $date: String!) {
    availableSlots(input: { facilityId: $facilityId, date: $date }) {
      facilityId
      date
      slots {
        startTime
        endTime
        isAvailable
      }
    }
  }
`;

export default function () {
  const facilityId = randomFacilityId();
  const date = getTomorrowDate();

  const payload = createGraphQLPayload(query, {
    facilityId,
    date,
  });

  const response = http.post(GRAPHQL_URL, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  let json;

  try {
    json = response.json();
  } catch (e) {
    json = null;
  }

  const data = json?.data?.availableSlots;
  const slots = data?.slots ?? [];

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'valid json': () => json !== null,
    'no errors': () => !json?.errors,
    'has availableSlots': () => data !== null && data !== undefined,
    'has slots array': () => Array.isArray(slots),
  });

  if (success) {
    const available = slots.filter(s => s?.isAvailable).length;
    const booked = slots.filter(s => !s?.isAvailable).length;

    availableSlots.add(available);
    bookedSlots.add(booked);
    responseSize.add(response.body.length);
  } else {
    if (json?.errors) {
      console.log(`❌ GraphQL errors: ${JSON.stringify(json.errors)}`);
    }
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'results/graphql/03-filtered-slots.json': JSON.stringify(data, null, 2),
  };
}