import { Router } from 'express';
import {
  create,
  list,
  getById,
  updateStatus,
  updatePriority,
  updateAssignee,
  bulkUpdateStatus,
  addNote,
  getNotes,
  stats,
  kpis,
  analytics,
  exportCsv,
} from '../controllers/inquiries.controller.js';
import {
  createInquirySchema,
  updateStatusSchema,
  updatePrioritySchema,
  updateAssigneeSchema,
  createNoteSchema,
  uuidParamSchema,
} from '../validators/inquiry.schema.js';
import { inquiryQuerySchema } from '../validators/query.schema.js';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { inquiryLimiter } from '../middleware/rateLimiters.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Public: Submit public inquiry (rate-limited, validated, honeypot protected)
router.post('/', inquiryLimiter, validate(createInquirySchema), asyncHandler(create));

// Protected: Aggregate statistics (total, new, in progress, resolved, last24h, last7d)
router.get('/stats', auth, asyncHandler(stats));

// Protected: Secondary KPIs (today, avg response time, resolution rate, busiest category)
router.get('/kpis', auth, asyncHandler(kpis));

// Protected: Analytics (daily counts, breakdowns, funnel, heatmap)
router.get('/analytics', auth, asyncHandler(analytics));

// Protected: Bulk update inquiry status
router.patch('/bulk-status', auth, asyncHandler(bulkUpdateStatus));

// Protected: Export filtered inquiries as CSV
router.get('/export', auth, validate(inquiryQuerySchema, 'query'), asyncHandler(exportCsv));

// Protected: List paginated, filtered, searched inquiries
router.get('/', auth, validate(inquiryQuerySchema, 'query'), asyncHandler(list));

// Protected: Get full inquiry details, notes, and activity log
router.get('/:id', auth, validate(uuidParamSchema, 'params'), asyncHandler(getById));

// Protected: Update inquiry status (writes activity audit log)
router.patch(
  '/:id/status',
  auth,
  validate(uuidParamSchema, 'params'),
  validate(updateStatusSchema),
  asyncHandler(updateStatus)
);

// Protected: Update inquiry priority (writes activity audit log)
router.patch(
  '/:id/priority',
  auth,
  validate(uuidParamSchema, 'params'),
  validate(updatePrioritySchema),
  asyncHandler(updatePriority)
);

// Protected: Assign inquiry to admin (writes activity audit log)
router.patch(
  '/:id/assign',
  auth,
  validate(uuidParamSchema, 'params'),
  validate(updateAssigneeSchema),
  asyncHandler(updateAssignee)
);

// Protected: Get notes for an inquiry
router.get(
  '/:id/notes',
  auth,
  validate(uuidParamSchema, 'params'),
  asyncHandler(getNotes)
);

// Protected: Add a note to an inquiry (writes activity audit log)
router.post(
  '/:id/notes',
  auth,
  validate(uuidParamSchema, 'params'),
  validate(createNoteSchema),
  asyncHandler(addNote)
);

export default router;
