import { Router } from 'express';
import { getAdminOptions } from '../controllers/admins.controller.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Protected: Get list of active admins for assignment dropdowns
router.get('/options', auth, asyncHandler(getAdminOptions));

export default router;
