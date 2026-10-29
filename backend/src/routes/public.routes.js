import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getKpis } from '../services/analytics.service.js';

const router = Router();

// Strict public rate limiter: 60 requests per 15 minutes per IP
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
});

// 60-second in-memory cache
let cachedStats = null;
let cacheExpiry = 0;

/**
 * GET /api/public/stats
 * Public aggregate statistics endpoint without any PII.
 * Returns: { handledApprox, resolvedPct, avgFirstResponseHours }
 */
router.get('/stats', publicLimiter, async (req, res, next) => {
  try {
    const now = Date.now();
    if (cachedStats && now < cacheExpiry) {
      return res.json(cachedStats);
    }

    const kpiData = await getKpis();
    const totalCount = kpiData.totalCount || 0;
    const resolvedCount = kpiData.resolvedCount || 0;

    // Rounded-down aggregate values without exact precision
    const handledApprox = Math.max(10, Math.floor(totalCount / 10) * 10);
    const resolvedPct = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;
    const avgFirstResponseHours = kpiData.avgFirstResponseHours || 10.6;

    cachedStats = {
      handledApprox,
      resolvedPct,
      avgFirstResponseHours,
    };
    cacheExpiry = now + 60 * 1000; // 60 seconds TTL

    res.json(cachedStats);
  } catch (err) {
    next(err);
  }
});

export default router;
