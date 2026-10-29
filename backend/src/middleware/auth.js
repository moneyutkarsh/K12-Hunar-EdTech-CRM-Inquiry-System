import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { findAdminById } from '../repositories/admins.repo.js';

export async function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new HttpError(401, 'UNAUTHORIZED', 'Authentication required. Missing Authorization header.'));
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(new HttpError(401, 'MALFORMED_TOKEN', 'Authorization header must follow Bearer <token> format.'));
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE,
    });

    // Verify admin exists and is active in database
    const admin = await findAdminById(decoded.sub);
    if (!admin) {
      return next(new HttpError(401, 'ADMIN_NOT_FOUND', 'Authenticated admin account no longer exists.'));
    }

    if (!admin.is_active) {
      return next(new HttpError(403, 'ACCOUNT_DEACTIVATED', 'This admin account has been deactivated.'));
    }

    // Verify token version has not been revoked
    const dbTokenVersion = admin.token_version || 1;
    const tokenVersionInJwt = decoded.tv !== undefined ? decoded.tv : 1;
    if (tokenVersionInJwt !== dbTokenVersion) {
      return next(new HttpError(401, 'REVOKED_TOKEN', 'Session has been invalidated. Please sign in again.'));
    }

    req.admin = {
      id: admin.id,
      name: admin.name || admin.email.split('@')[0],
      email: admin.email,
      role: admin.role,
      tokenVersion: dbTokenVersion,
      createdAt: admin.created_at,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new HttpError(401, 'TOKEN_EXPIRED', 'Your session has expired. Please sign in again.'));
    }
    return next(new HttpError(401, 'INVALID_TOKEN', 'Invalid authentication token signature or claims.'));
  }
}

export default auth;
