import { Facility, AvailableSlot, SlotAvailabilityQuery } from '../../core/types';
import { NotFoundError } from '../../core/errors/custom-errors';
import { facilitiesQueries } from '../../db/queries/facilities.queries';
import { bookingsQueries } from '../../db/queries/bookings.queries';

/**
 * Handles all facility-related business logic.
 * Shared by both REST and GraphQL implementations.
 */
export class FacilityService {
  async getAllFacilities(): Promise<Facility[]> {
    return await facilitiesQueries.findAll();
  }

  async getFacilityById(id: number): Promise<Facility> {
    const facility = await facilitiesQueries.findById(id);

    if (!facility) {
      throw new NotFoundError('Facility', id);
    }

    return facility;
  }

  async getFacilitiesByIds(ids: number[]): Promise<Facility[]> {
    return await facilitiesQueries.findByIds(ids);
  }

  /**
   * Business logic:
   * - Facility operates from openTime to closeTime
   * - Slots are 1 hour each
   * - Exclude already booked slots
   */
  async getAvailableSlots(params: SlotAvailabilityQuery): Promise<AvailableSlot[]> {
    const { facilityId, date } = params;

    const facility = await this.getFacilityById(facilityId);

    const bookedSlots = await bookingsQueries.getBookedSlots(facilityId, date);

    const allSlots = this.generateHourlySlots(
      facility.openTime,
      facility.closeTime
    );

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

  private slotsOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const toMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);

    return s1 < e2 && e1 > s2;
  }
}

export const facilityService = new FacilityService();