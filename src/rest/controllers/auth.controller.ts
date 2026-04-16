import { Request, Response, NextFunction } from 'express';
import { userService } from '../../core/services/user.service';
import { otpService } from '../../core/services/otp.service';
import { validate, loginSchema, otpSchema, otpResendSchema } from '../../core/validators/booking.validator';

export class AuthController {

  // async login(req: Request, res: Response, next: NextFunction): Promise<void> {
  //   try {
  //     const credentials = validate(loginSchema, req.body);

  //     const authResponse = await userService.login(credentials);

  //     res.status(200).json(authResponse);
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const credentials = validate(loginSchema, req.body);
      const authResponse = await userService.login(credentials);
      // console.log("authResponse (sessionId): ", authResponse);
      res.status(200).json(authResponse);
    } catch (error) {
      next(error);
    }
  }

  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const credentials = validate(otpSchema, req.body);
      // console.log("OTP credentials: ", credentials);
      const otpResponse = await otpService.verify(credentials);

      res.status(200).json(otpResponse)
    } catch (error) {
      next(error)
    }
  }

  async resend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const credentials = validate(otpResendSchema, req.body);
      const authResponse = await otpService.resendSession(credentials);
      // console.log("authResponse (sessionId): ", authResponse);
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