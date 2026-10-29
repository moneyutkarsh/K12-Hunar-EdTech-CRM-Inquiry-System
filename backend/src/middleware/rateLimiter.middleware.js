import rateLimit from 'express-rate-limit';

// Strict limiter for admin login: 5 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    },
  },
});

// Rate limiter for public inquiries: 15 submissions per 15 minutes per IP
export const inquirySubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many inquiries submitted from this IP. Please wait a few minutes before trying again.',
    },
  },
});

// General API rate limiter: 200 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many requests. Please slow down.',
    },
  },
});
