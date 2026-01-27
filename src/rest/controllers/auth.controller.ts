import { Request, Response, NextFunction } from 'express';
import { userService } from '@core/services/user.service';
import { validate, loginSchema } from '@core/validators/booking.validator';

export class AuthController {
  /**
   * POST /api/auth/login
   * Authenticate user and return JWT token
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input
      const credentials = validate(loginSchema, req.body);
      
      // Authenticate
      const authResponse = await userService.login(credentials);
      
      res.status(200).json(authResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached by authenticate middleware
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