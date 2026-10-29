import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST');
  const message = statusCode >= 500 && config.NODE_ENV === 'production'
    ? 'An internal server error occurred.'
    : err.message || 'An unexpected error occurred';

  if (statusCode >= 500 && config.NODE_ENV !== 'test') {
    logger.error({ err, reqId: req.id }, `Unhandled Error: ${err.message}`);
  }

  const payload = {
    error: {
      code,
      message,
      ...(err.details ? { details: err.details } : {}),
      requestId: req.id,
    },
  };

  if (err.retryAfterSeconds) {
    res.setHeader('Retry-After', err.retryAfterSeconds);
  }

  res.status(statusCode).json(payload);
}

export default errorHandler;
