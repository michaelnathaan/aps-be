import { Request, Response, NextFunction } from 'express';
import { userService } from '@core/services/user.service';
import { bookingService } from '@core/services/booking.service';

export class UsersController {
  /**
   * GET /api/users/:id
   * Get user by ID
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = await userService.getUserById(id);
      
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id/bookings
   * Get all bookings for a user
   */
  async getUserBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const bookings = await bookingService.getUserBookings(userId);
      
      res.status(200).json(bookings);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id/dashboard
   * Get user dashboard with bookings and statistics
   */
  async getUserDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const dashboard = await userService.getUserDashboard(userId);
      
      res.status(200).json(dashboard);
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();