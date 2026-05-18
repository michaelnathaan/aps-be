import { Facility, AvailableSlot, SlotAvailabilityQuery, CreateFacilityDTO, UpdateFacilityDTO } from '../../core/types';
import { NotFoundError } from '../../core/errors/custom-errors';
import { facilitiesQueries } from '../../db/queries/facilities.queries';
import { bookingsQueries } from '../../db/queries/bookings.queries';

export class FacilityService {
  async getAllFacilities(): Promise<Facility[]> {
    return await facilitiesQueries.findAll();
  }

  async getAllFacilitiesIncludingInactive(): Promise<Facility[]> {
    return await facilitiesQueries.findAllIncludingInactive();
  }

  async getFacilityById(id: number): Promise<Facility> {
    const facility = await facilitiesQueries.findById(id);
    if (!facility) throw new NotFoundError('Facility', id);
    return facility;
  }

  async getFacilitiesByIds(ids: number[]): Promise<Facility[]> {
    return await facilitiesQueries.findByIds(ids);
  }

  async createFacility(data: CreateFacilityDTO): Promise<Facility> {
    return await facilitiesQueries.create(data);
  }

  async updateFacility(id: number, data: UpdateFacilityDTO): Promise<Facility> {
    // Ensure facility exists first
    await this.getFacilityById(id);
    const updated = await facilitiesQueries.update(id, data);
    if (!updated) throw new NotFoundError('Facility', id);
    return updated;
  }

  async deleteFacility(id: number): Promise<boolean> {
    await this.getFacilityById(id);
    return await facilitiesQueries.delete(id);
  }

  async getAvailableSlots(params: SlotAvailabilityQuery): Promise<AvailableSlot[]> {
    const { facilityId, date } = params;
    const facility = await this.getFacilityById(facilityId);
    const bookedSlots = await bookingsQueries.getBookedSlots(facilityId, date);
    const allSlots = this.generateHourlySlots(facility.openTime, facility.closeTime);
    return allSlots.map(slot => ({
      ...slot,
      isAvailable: !bookedSlots.some(b => this.slotsOverlap(slot.startTime, slot.endTime, b.startTime, b.endTime)),
    }));
  }

  private generateHourlySlots(openTime: string, closeTime: string) {
    const slots = [];
    const [openHour] = openTime.split(':').map(Number);
    const [closeHour] = closeTime.split(':').map(Number);
    for (let h = openHour; h < closeHour; h++) {
      slots.push({
        startTime: `${String(h).padStart(2, '0')}:00:00`,
        endTime: `${String(h + 1).padStart(2, '0')}:00:00`,
      });
    }
    return slots;
  }

  private slotsOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
    const m = (t: string) => { const [h, mm] = t.split(':').map(Number); return h * 60 + mm; };
    return m(s1) < m(e2) && m(e1) > m(s2);
  }
}

export const facilityService = new FacilityService();