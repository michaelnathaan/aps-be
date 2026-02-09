import { Request, Response, NextFunction } from 'express';
import { userService } from '../../core/services/user.service';
import { bookingService } from '../../core/services/booking.service';

export class UsersController {
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = await userService.getUserById(id);

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async getUserBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const bookings = await bookingService.getUserBookings(userId);

      res.status(200).json(bookings);
    } catch (error) {
      next(error);
    }
  }

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