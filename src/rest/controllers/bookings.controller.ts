import { Request, Response, NextFunction } from 'express';
import { bookingService } from '../../core/services/booking.service';
import { validate, createBookingSchema } from '../../core/validators/booking.validator';

export class BookingsController {
  async getAllBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await bookingService.getAllBookings();

      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  }

  async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookingData = validate(createBookingSchema, req.body);

      const booking = await bookingService.createBooking(bookingData);

      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const booking = await bookingService.getBookingById(id);

      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }

  async getBookingWithDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const booking = await bookingService.getBookingWithDetails(id);

      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }

  async confirmBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const booking = await bookingService.confirmBooking(id);

      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }

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