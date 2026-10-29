import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller.js';
import { loginSchema } from '../validators/auth.schema.js';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiters.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Public: Admin login with strict 5 req/15 min rate limiter and lockout defense
router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(login));

// Protected: Get currently authenticated admin details
router.get('/me', auth, asyncHandler(getMe));

export default router;
