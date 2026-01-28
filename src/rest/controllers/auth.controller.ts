import { Request, Response, NextFunction } from 'express';
import { userService } from '../../core/services/user.service';
import { validate, loginSchema } from '../../core/validators/booking.validator';

export class AuthController {

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const credentials = validate(loginSchema, req.body);

      const authResponse = await userService.login(credentials);

      res.status(200).json(authResponse);
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      res.status(200).json(req.user);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();