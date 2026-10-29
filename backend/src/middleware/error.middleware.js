import { config } from '../config/env.js';

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    },
  });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  // Avoid logging sensitive items or flooding in production
  if (config.nodeEnv !== 'test') {
    console.error(`[Error] ${req.method} ${req.url} - ${err.message}`);
  }

  const response = {
    error: {
      message: statusCode === 500 && config.nodeEnv === 'production'
        ? 'Internal Server Error'
        : err.message || 'An unexpected error occurred',
      ...(err.details ? { details: err.details } : {}),
    },
  };

  res.status(statusCode).json(response);
};
