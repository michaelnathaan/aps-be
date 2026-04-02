/**
 * Scenario 6: Mixed Read-Write Workload (REST)
 * Purpose: Simulate realistic user behavior
 * Distribution: 70% browsing, 20% availability checks, 10% booking creation
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { REST_BASE_URL, LOAD_CONFIGS, TEST_USERS } from '../config/rest.config.js';
import { getRESTToken, authHeaders } from '../utils/auth.js';
import { randomFacilityId, getTomorrowDate, generateTimeSlot } from '../utils/data.js';

// Custom metrics
const browsingRequests = new Counter('browsing_requests');
const availabilityRequests = new Counter('availability_requests');
const bookingRequests = new Counter('booking_requests');
const successfulBookings = new Counter('successful_bookings');

export const options = {
  stages: LOAD_CONFIGS.mixed.stages,
  thresholds: {
    'http_req_duration': ['p(95)<800'],
    'http_req_failed': ['rate<0.05'],
  },
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
  const random = Math.random();
  
  if (random < 0.7) {
    // 70% - Browsing: List facilities or get facility details
    if (Math.random() < 0.5) {
      // List all facilities
      const response = http.get(`${REST_BASE_URL}/facilities`);
      check(response, { 'browsing: facilities list': (r) => r.status === 200 });
      browsingRequests.add(1);
    } else {
      // Get specific facility
      const facilityId = randomFacilityId();
      const response = http.get(`${REST_BASE_URL}/facilities/${facilityId}`);
      check(response, { 'browsing: facility details': (r) => r.status === 200 });
      browsingRequests.add(1);
    }
  } else if (random < 0.9) {
    // 20% - Check slot availability
    const facilityId = randomFacilityId();
    const date = getTomorrowDate();
    const response = http.get(`${REST_BASE_URL}/facilities/${facilityId}/slots?date=${date}`);
    check(response, { 'availability: slots check': (r) => r.status === 200 });
    availabilityRequests.add(1);
  } else {
    // 10% - Create booking
    const facilityId = randomFacilityId();
    const timeSlot = generateTimeSlot();
    
    const bookingData = {
      userId: userToken.userId,
      facilityId: facilityId,
      bookingDate: getTomorrowDate(),
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
    };
    
    const response = http.post(
      `${REST_BASE_URL}/bookings`,
      JSON.stringify(bookingData),
      { headers: authHeaders(userToken.token) }
    );
    
    bookingRequests.add(1);
    if (response.status === 201) {
      successfulBookings.add(1);
    }
  }
  
  sleep(Math.random() * 2 + 1); // 1-3 seconds between requests
}

export function handleSummary(data) {
  return {
    'tests/results/rest/06-mixed-workload.json': JSON.stringify(data, null, 2),
  };
}