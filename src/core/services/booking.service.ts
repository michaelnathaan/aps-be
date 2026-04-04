import {
  Booking,
  BookingWithDetails,
  CreateBookingDTO,
  BookingStatus
} from '../../core/types';
import {
  NotFoundError,
  BookingConflictError,
  BookingLimitExceededError,
  InvalidTimeSlotError,
  FacilityClosedError,
  BookingTooFarInAdvanceError
} from '../../core/errors/custom-errors';
import { bookingsQueries } from '../../db/queries/bookings.queries';
import { facilitiesQueries } from '../../db/queries/facilities.queries';
import { usersQueries } from '../../db/queries/users.queries';
import { startOfDay, differenceInDays } from 'date-fns';

/**
 * Core booking business logic shared by REST and GraphQL.
 * Implements all booking rules and validation.
 */
export class BookingService {
  private readonly MAX_BOOKINGS_PER_DAY = Number(process.env.MAX_BOOKINGS_PER_DAY);
  private readonly MAX_ADVANCE_DAYS = Number(process.env.MAX_ADVANCE_DAYS);

  /**
   * Validates:
   * - Time slot validity
   * - Facility operating hours
   * - Advance booking limit (max 3 days)
   * - Daily booking limit (max 4 per user)
   * - Booking conflicts
   * - Calculates price (free for verified tenants)
   */

  async getAllBookings(): Promise<Booking[]> {
    return await bookingsQueries.findAll();
  }
  async createBooking(data: CreateBookingDTO): Promise<Booking> {
    const { userId, facilityId, bookingDate, startTime, endTime } = data;

    this.validateTimeSlot(startTime, endTime);

    const facility = await facilitiesQueries.findById(facilityId);
    if (!facility) {
      throw new NotFoundError('Facility', facilityId);
    }
    if (!facility.isActive) {
      throw new InvalidTimeSlotError('This facility is currently unavailable');
    }

    this.validateBookingDate(bookingDate);

    this.validateOperatingHours(facility, startTime, endTime);

    await this.checkDailyBookingLimit(userId, bookingDate);

    await this.checkBookingConflict(facilityId, bookingDate, startTime, endTime, facility.name);

    const totalPrice = await this.calculatePrice(userId, facility.pricePerHour, startTime, endTime);

    const booking = await bookingsQueries.create({
      userId,
      facilityId,
      bookingDate,
      startTime,
      endTime,
      totalPrice
    });

    return booking;
  }

  async getBookingById(id: number): Promise<Booking> {
    const booking = await bookingsQueries.findById(id);
    if (!booking) {
      throw new NotFoundError('Booking', id);
    }
    return booking;
  }

  async getBookingWithDetails(id: number): Promise<BookingWithDetails> {
    const booking = await bookingsQueries.findByIdWithDetails(id);
    if (!booking) {
      throw new NotFoundError('Booking', id);
    }
    return booking;
  }

  async getUserBookingsPaginated(
    userId: number,
    limit: number,
    offset: number
  ): Promise<BookingWithDetails[]> {
    return await bookingsQueries.findByUserIdPaginated(userId, limit, offset);
  }

  async confirmBooking(id: number): Promise<Booking> {
    const booking = await this.getBookingById(id);

    if (booking.status !== BookingStatus.PENDING) {
      throw new InvalidTimeSlotError('Only pending bookings can be confirmed');
    }

    return await bookingsQueries.updateStatus(id, BookingStatus.CONFIRMED);
  }

  async cancelBooking(id: number): Promise<Booking> {
    const booking = await this.getBookingById(id);

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.EXPIRED) {
      throw new InvalidTimeSlotError('This booking is already cancelled or expired');
    }

    return await bookingsQueries.updateStatus(id, BookingStatus.CANCELLED);
  }

  private validateTimeSlot(startTime: string, endTime: string): void {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new InvalidTimeSlotError('Invalid time format. Use HH:MM or HH:MM:SS');
    }

    const toMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    if (toMinutes(startTime) >= toMinutes(endTime)) {
      throw new InvalidTimeSlotError('Start time must be before end time');
    }
  }

  private validateBookingDate(bookingDate: Date): void {
    const today = startOfDay(new Date());
    const bookingDay = startOfDay(bookingDate);

    if (bookingDay < today) {
      throw new InvalidTimeSlotError('Cannot book slots in the past');
    }

    const daysInAdvance = differenceInDays(bookingDay, today);
    if (daysInAdvance > this.MAX_ADVANCE_DAYS) {
      throw new BookingTooFarInAdvanceError(this.MAX_ADVANCE_DAYS);
    }
  }

  private validateOperatingHours(
    facility: { name: string; openTime: string; closeTime: string },
    startTime: string,
    endTime: string
  ): void {
    const toMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const openMinutes = toMinutes(facility.openTime);
    const closeMinutes = toMinutes(facility.closeTime);
    const startMinutes = toMinutes(startTime);
    const endMinutes = toMinutes(endTime);

    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      throw new FacilityClosedError(
        facility.name,
        `${startTime}-${endTime} (open: ${facility.openTime}-${facility.closeTime})`
      );
    }
  }

  private async checkDailyBookingLimit(userId: number, bookingDate: Date): Promise<void> {
    const count = await bookingsQueries.countUserBookingsOnDate(userId, bookingDate);

    if (count >= this.MAX_BOOKINGS_PER_DAY) {
      throw new BookingLimitExceededError(this.MAX_BOOKINGS_PER_DAY);
    }
  }

  private async checkBookingConflict(
    facilityId: number,
    bookingDate: Date,
    startTime: string,
    endTime: string,
    facilityName: string
  ): Promise<void> {
    const hasConflict = await bookingsQueries.checkConflict(
      facilityId,
      bookingDate,
      startTime,
      endTime
    );

    if (hasConflict) {
      const dateStr = bookingDate.toISOString().split('T')[0];
      throw new BookingConflictError(facilityName, dateStr, `${startTime}-${endTime}`);
    }
  }

  /**
   * - Verified tenants: free (0)
   * - Guests: price_per_hour * hours
   */
  private async calculatePrice(
    userId: number,
    pricePerHour: number,
    startTime: string,
    endTime: string
  ): Promise<number> {
    const isVerifiedTenant = await usersQueries.isVerifiedTenant(userId);

    if (isVerifiedTenant) {
      return 0;
    }

    const toMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const durationMinutes = toMinutes(endTime) - toMinutes(startTime);
    const hours = durationMinutes / 60;

    return pricePerHour * hours;
  }

  async deleteBooking(id: number): Promise<boolean> {
    await this.getBookingById(id); // throws NotFoundError if missing
    const deleted = await bookingsQueries.delete(id);
    return deleted;
  }
}

export const bookingService = new BookingService();