// facilities.router.ts
import { Router } from 'express';
import { facilitiesController } from '../controllers/facilities.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../../core/types';
import { uploadFacilityImage } from '../middleware/upload.middleware';

const router = Router();

// GET /api/facilities — public, active facilities only
router.get('/', (req, res, next) =>
  facilitiesController.getAllFacilities(req, res, next)
);

// GET /api/facilities/inactive — admin only
router.get('/all', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), (req, res, next) =>
  facilitiesController.getAllFacilitiesIncludingInactive(req, res, next)
);

// POST /api/facilities — admin only

router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  uploadFacilityImage.single('image'),
  facilitiesController.createFacility
);


// GET /api/facilities/:id/slots — must be before /:id
router.get('/:id/slots', (req, res, next) =>
  facilitiesController.getAvailableSlots(req, res, next)
);

// GET /api/facilities/:id
router.get('/:id', (req, res, next) =>
  facilitiesController.getFacilityById(req, res, next)
);

// PATCH /api/facilities/:id — admin only
router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  uploadFacilityImage.single("image"),
  facilitiesController.updateFacility.bind(facilitiesController)
);

// DELETE /api/facilities/:id — admin only
router.delete('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), (req, res, next) =>
  facilitiesController.deleteFacility(req, res, next)
);

export default router;