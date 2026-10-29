import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import inquiriesRoutes from './inquiries.routes.js';
import publicRoutes from './public.routes.js';
import trackRoutes from './track.routes.js';
import adminsRoutes from './admins.routes.js';
import activityRoutes from './activity.routes.js';
import openapiSpec from '../docs/openapi.js';

const router = Router();

// 1. Health Endpoint
router.use('/health', healthRoutes);

// 2. Swagger Documentation UI
router.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: 'K12 Hunar CRM API Docs' }));

// 3. Sub-routes
router.use('/auth', authRoutes);
router.use('/inquiries', inquiriesRoutes);
router.use('/public', publicRoutes);
router.use('/track', trackRoutes);
router.use('/admins', adminsRoutes);
router.use('/activity', activityRoutes);

export default router;
