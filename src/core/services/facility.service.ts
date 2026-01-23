import { Facility, AvailableSlot, SlotAvailabilityQuery } from '@core/types';
import { NotFoundError } from '@core/errors/custom-errors';
import { facilitiesQueries } from '@db/queries/facilities.queries';
import { bookingsQueries } from '@db/queries/bookings.queries';

/**
 * FacilityService
 * 
 * Handles all facility-related business logic.
 * Shared by both REST and GraphQL implementations.
 */
export class FacilityService {
  /**
   * Get all active facilities
   */
  async getAllFacilities(): Promise<Facility[]> {
    return await facilitiesQueries.findAll();
  }

  /**
   * Get facility by ID
   * 
   * @throws NotFoundError if facility doesn't exist
   */
  async getFacilityById(id: number): Promise<Facility> {
    const facility = await facilitiesQueries.findById(id);
    
    if (!facility) {
      throw new NotFoundError('Facility', id);
    }
    
    return facility;
  }

  /**
   * Get multiple facilities by IDs (for DataLoader batching)
   */
  async getFacilitiesByIds(ids: number[]): Promise<Facility[]> {
    return await facilitiesQueries.findByIds(ids);
  }

  /**
   * Get available time slots for a facility on a specific date
   * 
   * Business logic:
   * - Facility operates from openTime to closeTime
   * - Slots are 1 hour each
   * - Exclude already booked slots
   */
  async getAvailableSlots(params: SlotAvailabilityQuery): Promise<AvailableSlot[]> {
    const { facilityId, date } = params;
    
    // Get facility to check operating hours
    const facility = await this.getFacilityById(facilityId);
    
    // Get booked slots for this date
    const bookedSlots = await bookingsQueries.getBookedSlots(facilityId, date);
    
    // Generate all possible hourly slots
    const allSlots = this.generateHourlySlots(
      facility.openTime,
      facility.closeTime
    );
    
    // Mark slots as available/unavailable
    const availableSlots: AvailableSlot[] = allSlots.map(slot => {
      const isBooked = bookedSlots.some(booked => 
        this.slotsOverlap(slot.startTime, slot.endTime, booked.startTime, booked.endTime)
      );
      
      return {
        ...slot,
        isAvailable: !isBooked
      };
    });
    
    return availableSlots;
  }

  /**
   * Generate hourly time slots between open and close time
   * Example: 06:00 - 22:00 generates slots: 06:00-07:00, 07:00-08:00, ..., 21:00-22:00
   */
  private generateHourlySlots(openTime: string, closeTime: string): { startTime: string; endTime: string }[] {
    const slots: { startTime: string; endTime: string }[] = [];
    
    const [openHour] = openTime.split(':').map(Number);
    const [closeHour] = closeTime.split(':').map(Number);
    
    for (let hour = openHour; hour < closeHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
      slots.push({ startTime, endTime });
    }
    
    return slots;
  }

  /**
   * Check if two time slots overlap
   */
  private slotsOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    // Convert to minutes for easier comparison
    const toMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);
    
    // Slots overlap if: (start1 < end2) AND (end1 > start2)
    return s1 < e2 && e1 > s2;
  }
}

// Export singleton instance
export const facilityService = new FacilityService();