import { Router } from 'express';
import { facilitiesController } from '../controllers/facilities.controller';

const router = Router();

/**
 * GET /api/facilities
 * Get all active facilities
 */
router.get('/', (req, res, next) => 
  facilitiesController.getAllFacilities(req, res, next)
);

/**
 * GET /api/facilities/:id
 * Get facility by ID
 */
router.get('/:id', (req, res, next) => 
  facilitiesController.getFacilityById(req, res, next)
);

/**
 * GET /api/facilities/:id/slots?date=YYYY-MM-DD
 * Get available time slots for a facility
 */
router.get('/:id/slots', (req, res, next) => 
  facilitiesController.getAvailableSlots(req, res, next)
);

export default router;