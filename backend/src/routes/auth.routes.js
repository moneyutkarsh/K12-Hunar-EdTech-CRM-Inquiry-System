import { Router } from 'express';
import { login, signup, getMe } from '../controllers/auth.controller.js';
import { loginSchema } from '../validators/auth.schema.js';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiters.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Public: Admin login with strict rate limiter and lockout defense
router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(login));

// Public: Admin signup/registration
router.post('/signup', validate(loginSchema), asyncHandler(signup));

// Protected: Get currently authenticated admin details
router.get('/me', auth, asyncHandler(getMe));

export default router;
