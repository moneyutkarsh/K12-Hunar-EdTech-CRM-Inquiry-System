import { Router } from 'express';
import { getActivityFeed } from '../controllers/activity.controller.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Protected: Get cursor-paginated activity feed
router.get('/', auth, asyncHandler(getActivityFeed));

export default router;
