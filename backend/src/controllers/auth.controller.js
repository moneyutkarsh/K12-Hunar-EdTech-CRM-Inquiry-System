import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { config } from '../config/env.js';

// Precomputed dummy bcrypt hash to defend against timing attacks when user is not found
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

export const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Parameterized lookup of admin by lowercase email
  const result = await query(
    'SELECT id, email, password_hash, created_at FROM admins WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [normalizedEmail]
  );

  const admin = result.rows[0];

  // 2. Timing attack mitigation: always compare against real hash or dummy hash
  const hashToCompare = admin ? admin.password_hash : DUMMY_HASH;
  const isMatch = await bcrypt.compare(password, hashToCompare);

  if (!admin || !isMatch) {
    return res.status(401).json({
      error: {
        message: 'Invalid email or password',
      },
    });
  }

  // 3. Generate Custom JWT (8h expiry)
  const payload = {
    id: admin.id,
    email: admin.email,
  };

  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  return res.status(200).json({
    message: 'Login successful',
    token,
    admin: {
      id: admin.id,
      email: admin.email,
    },
  });
};

export const getMe = async (req, res) => {
  const { id } = req.admin;

  const result = await query(
    'SELECT id, email, created_at FROM admins WHERE id = $1 LIMIT 1',
    [id]
  );

  const admin = result.rows[0];
  if (!admin) {
    return res.status(404).json({
      error: {
        message: 'Admin account not found',
      },
    });
  }

  return res.status(200).json({
    admin: {
      id: admin.id,
      email: admin.email,
      created_at: admin.created_at,
    },
  });
};
