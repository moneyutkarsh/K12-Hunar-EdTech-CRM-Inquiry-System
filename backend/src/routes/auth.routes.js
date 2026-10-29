import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller.js';
import { loginSchema } from '../validators/auth.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { loginLimiter } from '../middleware/rateLimiter.middleware.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

const router = Router();

// Public: Admin login (strictly rate-limited)
router.post('/login', loginLimiter, validate(loginSchema), asyncWrapper(login));

// Protected: Get current authenticated admin
router.get('/me', authMiddleware, asyncWrapper(getMe));

export default router;
