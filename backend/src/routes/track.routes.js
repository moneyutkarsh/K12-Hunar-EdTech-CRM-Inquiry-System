import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { trackInquiry } from '../controllers/track.controller.js';

const router = Router();

// Strict public tracker rate limiter: 10 requests per 15 minutes per IP
const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many tracking attempts from this IP, please try again in 15 minutes.',
    },
  },
});

router.post('/', trackLimiter, trackInquiry);

export default router;
