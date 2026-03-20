import { Request, Response, NextFunction } from 'express';
import { userService } from '../../core/services/user.service';
import { bookingService } from '../../core/services/booking.service';
import { createUserSchema, updateUserSchema, validate } from '../../core/validators/booking.validator';

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

  async getAllUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) { next(error); }
  }

  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = validate(createUserSchema, req.body);
      const user = await userService.createUser(data);
      res.status(201).json(user);
    } catch (error) { next(error); }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const data = validate(updateUserSchema, req.body);
      const user = await userService.updateUser(id, data);
      res.status(200).json(user);
    } catch (error) { next(error); }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await userService.deleteUser(id);
      res.status(204).send();
    } catch (error) { next(error); }
  }
}

export const usersController = new UsersController();