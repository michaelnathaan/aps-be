// users.router.ts
import { Router } from 'express';
import { usersController } from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../../core/types';

const router = Router();

// GET /api/users — all users, admin only
router.get('/', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), (req, res, next) =>
  usersController.getAllUsers(req, res, next)
);

// POST /api/users — admin only
router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), (req, res, next) =>
  usersController.createUser(req, res, next)
);

// GET /api/users/:id/bookings — must be before /:id
router.get('/:id/bookings', authenticate, (req, res, next) =>
  usersController.getUserBookings(req, res, next)
);

// GET /api/users/:id/dashboard — must be before /:id
router.get('/:id/dashboard', authenticate, (req, res, next) =>
  usersController.getUserDashboard(req, res, next)
);

// GET /api/users/:id
router.get('/:id', authenticate, (req, res, next) =>
  usersController.getUserById(req, res, next)
);

// PATCH /api/users/:id — admin only
router.patch('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), (req, res, next) =>
  usersController.updateUser(req, res, next)
);

// DELETE /api/users/:id — admin only
router.delete('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), (req, res, next) =>
  usersController.deleteUser(req, res, next)
);

export default router;