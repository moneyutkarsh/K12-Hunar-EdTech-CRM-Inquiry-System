import { Router } from 'express';
import {
  createInquiry,
  getInquiries,
  getStats,
  exportCsv,
  updateStatus,
} from '../controllers/inquiry.controller.js';
import {
  createInquirySchema,
  inquiryQuerySchema,
  uuidParamSchema,
  updateStatusSchema,
} from '../validators/inquiry.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { inquirySubmissionLimiter } from '../middleware/rateLimiter.middleware.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

const router = Router();

// Public: Submit inquiry (rate-limited, validated, honeypot protected)
router.post(
  '/',
  inquirySubmissionLimiter,
  validate(createInquirySchema),
  asyncWrapper(createInquiry)
);

// Protected: Get statistics (total and per-status breakdown)
router.get('/stats', authMiddleware, asyncWrapper(getStats));

// Protected: Export filtered inquiries as CSV (with CSV injection defense)
router.get(
  '/export',
  authMiddleware,
  validate(inquiryQuerySchema, 'query'),
  asyncWrapper(exportCsv)
);

// Protected: Get paginated, filtered, searched inquiries
router.get(
  '/',
  authMiddleware,
  validate(inquiryQuerySchema, 'query'),
  asyncWrapper(getInquiries)
);

// Protected: Update inquiry status (New -> In Progress -> Resolved)
router.patch(
  '/:id/status',
  authMiddleware,
  validate(uuidParamSchema, 'params'),
  validate(updateStatusSchema),
  asyncWrapper(updateStatus)
);

export default router;
