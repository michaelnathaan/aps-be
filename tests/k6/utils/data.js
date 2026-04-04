/**
 * Test data generators
 */

// Facility IDs (from seed data)
export const FACILITY_IDS = [1, 2, 3, 4, 5, 6, 7];

// Random facility ID
export function randomFacilityId() {
  return FACILITY_IDS[Math.floor(Math.random() * FACILITY_IDS.length)];
}

// Generate future date (within 3-day limit)
export function generateFutureDate() {
  const today = new Date();
  const daysAhead = Math.floor(Math.random() * 3) + 1; // 1-3 days
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + daysAhead);
  
  return futureDate.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Generate random time slot (hourly slots from 06:00 to 21:00)
export function generateTimeSlot() {
  const startHour = 6 + Math.floor(Math.random() * 15); // 6-20
  const startTime = `${String(startHour).padStart(2, '0')}:00:00`;
  const endTime = `${String(startHour + 1).padStart(2, '0')}:00:00`;
  
  return { startTime, endTime };
}

// Generate today's date
export function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Generate tomorrow's date
export function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}