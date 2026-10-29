import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { findAdminByEmail, updateAdminLastLogin, upsertAdmin } from '../repositories/admins.repo.js';
import { checkLockout, logAttempt } from './loginAttempts.service.js';

// Precomputed bcrypt cost 12 dummy hash for constant-time comparisons
const DUMMY_HASH = '$2a$12$e8x5a3q4k1b7c9d0f2g3h4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9y';

export async function loginAdmin({ email, password, clientIp }) {
  const normalizedEmail = email.toLowerCase().trim();
  const ipHash = clientIp ? crypto.createHash('sha256').update(clientIp).digest('hex') : null;

  // 1. Enforce lockout rule: 5 failed attempts in 15 mins -> 429 ACCOUNT_LOCKED
  await checkLockout(normalizedEmail);

  // 2. Fetch admin from database
  const admin = await findAdminByEmail(normalizedEmail);

  // 3. Constant-time timing attack defense: ALWAYS run bcrypt.compare
  const hashToCompare = admin && admin.is_active ? admin.password_hash : DUMMY_HASH;
  const isMatch = await bcrypt.compare(password, hashToCompare);

  if (!admin || !admin.is_active || !isMatch) {
    await logAttempt(normalizedEmail, ipHash, false);
    throw HttpError.unauthorized('Invalid email or password');
  }

  // 4. Record successful login attempt and update last_login_at
  await logAttempt(normalizedEmail, ipHash, true);
  await updateAdminLastLogin(admin.id);

  // 5. Generate secure HS256 JWT with explicit claims
  const jti = crypto.randomUUID();
  const payload = {
    sub: admin.id,
    email: admin.email,
    role: admin.role,
    jti,
  };

  const token = jwt.sign(payload, config.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: config.JWT_EXPIRES_IN,
    issuer: config.JWT_ISSUER,
    audience: config.JWT_AUDIENCE,
  });

  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000).toISOString();

  return {
    token,
    expiresAt,
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    },
  };
}

export async function registerAdmin({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await findAdminByEmail(normalizedEmail);
  if (existing) {
    throw HttpError.badRequest('An admin account with this email already exists.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const newAdmin = await upsertAdmin({ email: normalizedEmail, passwordHash, role: 'admin' });

  const jti = crypto.randomUUID();
  const payload = {
    sub: newAdmin.id,
    email: newAdmin.email,
    role: newAdmin.role,
    jti,
  };

  const token = jwt.sign(payload, config.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: config.JWT_EXPIRES_IN,
    issuer: config.JWT_ISSUER,
    audience: config.JWT_AUDIENCE,
  });

  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000).toISOString();

  return {
    token,
    expiresAt,
    admin: {
      id: newAdmin.id,
      email: newAdmin.email,
      role: newAdmin.role,
    },
  };
}

export default { loginAdmin, registerAdmin };
