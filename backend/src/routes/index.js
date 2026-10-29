import { Router } from 'express';
import authRoutes from './auth.routes.js';
import inquiryRoutes from './inquiry.routes.js';

const router = Router();

// Health check endpoint (used by Render and frontend warm-up)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular sub-routes
router.use('/auth', authRoutes);
router.use('/inquiries', inquiryRoutes);

export default router;
