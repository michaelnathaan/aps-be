import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../../core/errors/custom-errors';
import { userService } from '../../core/services/user.service';
import { User, UserRole } from '../../core/types';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); 
    
    const user = await userService.verifyToken(token);

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...allowedRoles: UserRole[]) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await userService.verifyToken(token);
      req.user = user;
    }

    next();
  } catch (error) {
    next();
  }
}