export class HttpError extends Error {
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details = undefined) {
    return new HttpError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Authentication required', code = 'UNAUTHORIZED') {
    return new HttpError(401, code, message);
  }

  static forbidden(message = 'Permission denied', code = 'FORBIDDEN') {
    return new HttpError(403, code, message);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new HttpError(404, code, message);
  }

  static rateLimited(message = 'Too many requests. Please slow down.', code = 'RATE_LIMITED') {
    return new HttpError(429, code, message);
  }

  static accountLocked(message = 'Account temporarily locked due to multiple failed login attempts.', retryAfterSeconds = 900) {
    const err = new HttpError(429, 'ACCOUNT_LOCKED', message);
    err.retryAfterSeconds = retryAfterSeconds;
    return err;
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new HttpError(500, code, message);
  }
}

export default HttpError;
