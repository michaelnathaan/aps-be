import { Router } from 'express';
import { usersController } from '../controllers/users.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', authenticate, (req, res, next) => 
  usersController.getUserById(req, res, next)
);

/**
 * GET /api/users/:id/bookings
 * Get all bookings for a user
 */
router.get('/:id/bookings', authenticate, (req, res, next) => 
  usersController.getUserBookings(req, res, next)
);

/**
 * GET /api/users/:id/dashboard
 * Get user dashboard with statistics
 */
router.get('/:id/dashboard', authenticate, (req, res, next) => 
  usersController.getUserDashboard(req, res, next)
);

export default router;