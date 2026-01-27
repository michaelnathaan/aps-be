import { Request, Response, NextFunction } from 'express';
import { bookingService } from '@core/services/booking.service';
import { validate, createBookingSchema } from '@core/validators/booking.validator';

export class BookingsController {
  /**
   * POST /api/bookings
   * Create a new booking
   */
  async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input
      const bookingData = validate(createBookingSchema, req.body);
      
      // Create booking
      const booking = await bookingService.createBooking(bookingData);
      
      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bookings/:id
   * Get booking by ID
   */
  async getBookingById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const booking = await bookingService.getBookingById(id);
      
      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bookings/:id/details
   * Get booking with full details (user + facility)
   */
  async getBookingWithDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const booking = await bookingService.getBookingWithDetails(id);
      
      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/bookings/:id/confirm
   * Confirm a booking (payment received)
   */
  async confirmBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const booking = await bookingService.confirmBooking(id);
      
      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/bookings/:id
   * Cancel a booking
   */
  async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const booking = await bookingService.cancelBooking(id);
      
      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }
}

export const bookingsController = new BookingsController();