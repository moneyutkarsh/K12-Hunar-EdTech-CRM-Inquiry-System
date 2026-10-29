import { Router } from 'express';
import { login, signup, getMe, changePassword, logoutAll, oauthGoogle, oauthMicrosoft } from '../controllers/auth.controller.js';
import { loginSchema, changePasswordSchema } from '../validators/auth.schema.js';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiters.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Public: Admin login with strict rate limiter and lockout defense
router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(login));

// Public: OAuth Sign-In (Google & Microsoft)
router.post('/oauth/google', loginLimiter, asyncHandler(oauthGoogle));
router.post('/oauth/microsoft', loginLimiter, asyncHandler(oauthMicrosoft));

// Public: Admin signup/registration
router.post('/signup', validate(loginSchema), asyncHandler(signup));

// Protected: Get currently authenticated admin details
router.get('/me', auth, asyncHandler(getMe));

// Protected: Change admin password (invalidates all other sessions via token_version increment)
router.patch('/password', auth, validate(changePasswordSchema), asyncHandler(changePassword));

// Protected: Logout from all active sessions
router.post('/logout-all', auth, asyncHandler(logoutAll));

export default router;

