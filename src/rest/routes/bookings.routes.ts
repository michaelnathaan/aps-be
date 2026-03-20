// bookings.router.ts
import { Router } from 'express';
import { bookingsController } from '../controllers/bookings.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../../core/types';

const router = Router();

// GET /api/bookings — all bookings, admin only
router.get('/', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), (req, res, next) =>
  bookingsController.getAllBookings(req, res, next)
);

// POST /api/bookings — create booking
router.post('/', authenticate, (req, res, next) =>
  bookingsController.createBooking(req, res, next)
);

// GET /api/bookings/:id/details — must be before /:id or Express matches /:id first
router.get('/:id/details', authenticate, (req, res, next) =>
  bookingsController.getBookingWithDetails(req, res, next)
);

// GET /api/bookings/:id
router.get('/:id', authenticate, (req, res, next) =>
  bookingsController.getBookingById(req, res, next)
);

// PUT /api/bookings/:id/confirm
router.put('/:id/confirm', authenticate, (req, res, next) =>
  bookingsController.confirmBooking(req, res, next)
);

// DELETE /api/bookings/:id — cancel (soft, sets status to cancelled)
router.delete('/:id', authenticate, (req, res, next) =>
  bookingsController.cancelBooking(req, res, next)
);

// DELETE /api/bookings/:id/hard — permanent delete, admin only
router.delete('/:id/hard', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), (req, res, next) =>
  bookingsController.deleteBooking(req, res, next)
);

export default router;