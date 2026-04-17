/**
 * Scenario 3: Filtered Slot Availability (REST)
 * Purpose: Test parameter handling and date filtering
 * Measures: GET /facilities/:id/slots?date=... performance
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { REST_BASE_URL, LOAD_CONFIGS, THRESHOLDS } from '../config/config.js';
import { randomFacilityId, getTomorrowDate } from '../utils/data.js';

// Custom metrics
const availableSlots = new Counter('available_slots_count');
const bookedSlots = new Counter('booked_slots_count');
const responseSize = new Trend('response_size_bytes');

export const options = {
  stages: LOAD_CONFIGS.read.stages,
  thresholds: THRESHOLDS,
};

export default function () {
  const facilityId = randomFacilityId();
  const date = getTomorrowDate();

  const response = http.get(
    `${REST_BASE_URL}/facilities/${facilityId}/slots?date=${date}`,
    { headers: { 'Content-Type': 'application/json' } }
  );

  let json;

  try {
    json = response.json(); // safer than JSON.parse
  } catch (e) {
    json = null;
  }

  const slots = json?.slots ?? [];

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'valid json': () => json !== null,
    'has facilityId': () => json?.facilityId !== undefined,
    'has date': () => json?.date !== undefined,
    'has slots array': () => Array.isArray(slots),
    'slots have availability': () =>
      slots.length === 0 || slots[0]?.isAvailable !== undefined,
  });

  if (success) {
    const available = slots.filter(s => s?.isAvailable).length;
    const booked = slots.filter(s => !s?.isAvailable).length;

    availableSlots.add(available);
    bookedSlots.add(booked);
    responseSize.add(response.body.length);
  } else {
    if (response.status !== 200) {
      console.log(`REST ERROR ${response.status}: ${response.body}`);
    }
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'tests/results/rest/03-filtered-slots.json': JSON.stringify(data, null, 2),
  };
}