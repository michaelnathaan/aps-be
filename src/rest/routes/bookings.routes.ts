import { Router } from 'express';
import { bookingsController } from '../controllers/bookings.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/bookings
 * Create a new booking
 */
router.post('/', authenticate, (req, res, next) => 
  bookingsController.createBooking(req, res, next)
);

/**
 * GET /api/bookings/:id
 * Get booking by ID
 */
router.get('/:id', authenticate, (req, res, next) => 
  bookingsController.getBookingById(req, res, next)
);

/**
 * GET /api/bookings/:id/details
 * Get booking with full details (user + facility)
 */
router.get('/:id/details', authenticate, (req, res, next) => 
  bookingsController.getBookingWithDetails(req, res, next)
);

/**
 * PUT /api/bookings/:id/confirm
 * Confirm a booking
 */
router.put('/:id/confirm', authenticate, (req, res, next) => 
  bookingsController.confirmBooking(req, res, next)
);

/**
 * DELETE /api/bookings/:id
 * Cancel a booking
 */
router.delete('/:id', authenticate, (req, res, next) => 
  bookingsController.cancelBooking(req, res, next)
);

export default router;