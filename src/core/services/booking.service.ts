import { 
  Booking, 
  BookingWithDetails, 
  CreateBookingDTO, 
  BookingStatus 
} from '@core/types';
import { 
  NotFoundError,
  BookingConflictError,
  BookingLimitExceededError,
  InvalidTimeSlotError,
  FacilityClosedError,
  BookingTooFarInAdvanceError
} from '@core/errors/custom-errors';
import { bookingsQueries } from '@db/queries/bookings.queries';
import { facilitiesQueries } from '@db/queries/facilities.queries';
import { usersQueries } from '@db/queries/users.queries';
import { startOfDay, differenceInDays } from 'date-fns';

/**
 * BookingService
 * 
 * Core booking business logic shared by REST and GraphQL.
 * Implements all booking rules and validation.
 */
export class BookingService {
  // Business rule constants
  private readonly MAX_BOOKINGS_PER_DAY = Number(process.env.MAX_BOOKINGS_PER_DAY) || 2;
  private readonly MAX_ADVANCE_DAYS = Number(process.env.MAX_ADVANCE_DAYS) || 3;

  /**
   * Create a new booking with full validation
   * 
   * Validates:
   * - Time slot validity
   * - Facility operating hours
   * - Advance booking limit (max 3 days)
   * - Daily booking limit (max 4 per user)
   * - Booking conflicts
   * - Calculates price (free for verified tenants)
   */
  async createBooking(data: CreateBookingDTO): Promise<Booking> {
    const { userId, facilityId, bookingDate, startTime, endTime } = data;
    
    // 1. Validate time slot format and logic
    this.validateTimeSlot(startTime, endTime);
    
    // 2. Check if facility exists and is active
    const facility = await facilitiesQueries.findById(facilityId);
    if (!facility) {
      throw new NotFoundError('Facility', facilityId);
    }
    if (!facility.isActive) {
      throw new InvalidTimeSlotError('This facility is currently unavailable');
    }
    
    // 3. Validate booking date (not in the past, not too far in advance)
    this.validateBookingDate(bookingDate);
    
    // 4. Check if booking is within facility operating hours
    this.validateOperatingHours(facility, startTime, endTime);
    
    // 5. Check user's daily booking limit
    await this.checkDailyBookingLimit(userId, bookingDate);
    
    // 6. Check for conflicts with existing bookings
    await this.checkBookingConflict(facilityId, bookingDate, startTime, endTime, facility.name);
    
    // 7. Calculate total price (free for verified tenants)
    const totalPrice = await this.calculatePrice(userId, facility.pricePerHour, startTime, endTime);
    
    // 8. Create the booking
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

  /**
   * Get booking by ID
   */
  async getBookingById(id: number): Promise<Booking> {
    const booking = await bookingsQueries.findById(id);
    if (!booking) {
      throw new NotFoundError('Booking', id);
    }
    return booking;
  }

  /**
   * Get booking with full details (user + facility)
   */
  async getBookingWithDetails(id: number): Promise<BookingWithDetails> {
    const booking = await bookingsQueries.findByIdWithDetails(id);
    if (!booking) {
      throw new NotFoundError('Booking', id);
    }
    return booking;
  }

  /**
   * Get all bookings for a user
   */
  async getUserBookings(userId: number): Promise<BookingWithDetails[]> {
    return await bookingsQueries.findByUserId(userId);
  }

  /**
   * Confirm a booking (payment received or tenant verified)
   */
  async confirmBooking(id: number): Promise<Booking> {
    const booking = await this.getBookingById(id);
    
    if (booking.status !== BookingStatus.PENDING) {
      throw new InvalidTimeSlotError('Only pending bookings can be confirmed');
    }
    
    return await bookingsQueries.updateStatus(id, BookingStatus.CONFIRMED);
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(id: number): Promise<Booking> {
    const booking = await this.getBookingById(id);
    
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.EXPIRED) {
      throw new InvalidTimeSlotError('This booking is already cancelled or expired');
    }
    
    return await bookingsQueries.updateStatus(id, BookingStatus.CANCELLED);
  }

  /**
   * Validate time slot format and logic
   */
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

  /**
   * Validate booking date (must be today or future, max 3 days advance)
   */
  private validateBookingDate(bookingDate: Date): void {
    const today = startOfDay(new Date());
    const bookingDay = startOfDay(bookingDate);
    
    // Can't book in the past
    if (bookingDay < today) {
      throw new InvalidTimeSlotError('Cannot book slots in the past');
    }
    
    // Can't book more than 3 days in advance
    const daysInAdvance = differenceInDays(bookingDay, today);
    if (daysInAdvance > this.MAX_ADVANCE_DAYS) {
      throw new BookingTooFarInAdvanceError(this.MAX_ADVANCE_DAYS);
    }
  }

  /**
   * Validate booking is within facility operating hours
   */
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

  /**
   * Check if user has reached daily booking limit (max 4 per day)
   */
  private async checkDailyBookingLimit(userId: number, bookingDate: Date): Promise<void> {
    const count = await bookingsQueries.countUserBookingsOnDate(userId, bookingDate);
    
    if (count >= this.MAX_BOOKINGS_PER_DAY) {
      throw new BookingLimitExceededError(this.MAX_BOOKINGS_PER_DAY);
    }
  }

  /**
   * Check for booking conflicts (overlapping time slots)
   */
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
   * Calculate booking price
   * - Verified tenants: free (0)
   * - Guests: price_per_hour * hours
   */
  private async calculatePrice(
    userId: number,
    pricePerHour: number,
    startTime: string,
    endTime: string
  ): Promise<number> {
    // Check if user is verified tenant
    const isVerifiedTenant = await usersQueries.isVerifiedTenant(userId);
    
    if (isVerifiedTenant) {
      return 0; // Free for tenants
    }
    
    // Calculate hours
    const toMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const durationMinutes = toMinutes(endTime) - toMinutes(startTime);
    const hours = durationMinutes / 60;
    
    return pricePerHour * hours;
  }
}

// Export singleton instance
export const bookingService = new BookingService();