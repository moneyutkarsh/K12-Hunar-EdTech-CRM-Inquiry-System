import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { config, validateEnv } from './config/env.js';
import pool from './config/db.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import { apiLimiter } from './middleware/rateLimiter.middleware.js';

// 1. Fail fast on configuration errors
validateEnv();

const app = express();

// 2. Enable trust proxy for Render / Vercel reverse proxies
app.set('trust proxy', 1);

// 3. Security headers with Helmet
app.use(helmet());

// 4. CORS configuration (supports comma-separated origins)
const allowedOrigins = config.clientUrl
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 5. Body parser with strict limit
app.use(express.json({ limit: '10kb' }));

// 6. Request logging (clean format)
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
}

// 7. General rate limiter
app.use('/api', apiLimiter);

// 8. Mount API routes
app.use('/api', routes);

// 9. Root fallback route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'K12 Hunar CRM & Inquiry System API',
    version: '1.0.0',
    health: '/api/health',
  });
});

// 10. 404 and Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// 11. Start Server
const server = app.listen(config.port, () => {
  console.log(`🚀 K12 Hunar CRM Backend running on port ${config.port} (${config.nodeEnv} mode)`);
  console.log(`📡 Health check: http://localhost:${config.port}/api/health`);
});

// 12. Graceful Shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      if (pool && typeof pool.end === 'function') {
        await pool.end();
        console.log('PostgreSQL pool drained.');
      }
    } catch (err) {
      console.error('Error during pool shutdown:', err);
    }
    process.exit(0);
  });

  // Force close after 10s timeout
  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
