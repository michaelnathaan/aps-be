import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/auth/login
 * Login with phone number
 */
router.post('/login', (req, res, next) =>
    authController.login(req, res, next)
);

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, (req, res, next) =>
    authController.getCurrentUser(req, res, next)
);

export default router;