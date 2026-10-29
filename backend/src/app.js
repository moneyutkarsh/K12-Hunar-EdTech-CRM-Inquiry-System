import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { config, validateEnv } from './config/env.js';
import routes from './routes/index.js';
import requestId from './middleware/requestId.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiters.js';

// Assert required environment variables on app creation
validateEnv();

export function createApp() {
  const app = express();

  // 1. Enable trust proxy for Render / Vercel
  app.set('trust proxy', 1);

  // 2. Security headers via Helmet (configured to allow Swagger UI scripts/styles)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI inline assets
    })
  );

  // 3. Response compression
  app.use(compression());

  // 4. Request Correlation ID
  app.use(requestId);

  // 5. CORS configuration
  const allowedOrigins = config.CLIENT_URL
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked request from origin: ${origin}`));
      },
      credentials: false,
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    })
  );

  // 6. JSON body parser with strict limit
  app.use(express.json({ limit: '10kb' }));

  // 7. General API rate limiter
  app.use('/api', generalLimiter);

  // 8. Mount modular API router
  app.use('/api', routes);

  // 9. Root fallback
  app.get('/', (req, res) => {
    res.status(200).json({
      name: 'K12 Hunar CRM & Inquiry System API',
      version: '1.0.0',
      health: '/api/health',
      docs: '/api/docs',
    });
  });

  // 10. Centralized 404 and Error Handlers
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
