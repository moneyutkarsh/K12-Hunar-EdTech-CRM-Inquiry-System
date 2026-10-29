import { query } from '../config/db.js';

export async function findAdminByEmail(email) {
  const sql = `
    SELECT id, email, password_hash, role, is_active, last_login_at, created_at
    FROM admins
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
  `;
  const result = await query(sql, [email.toLowerCase().trim()]);
  return result.rows[0] || null;
}

export async function findAdminById(id) {
  const sql = `
    SELECT id, email, role, is_active, last_login_at, created_at
    FROM admins
    WHERE id = $1
    LIMIT 1
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

export async function updateAdminLastLogin(id) {
  const sql = `
    UPDATE admins
    SET last_login_at = NOW()
    WHERE id = $1
    RETURNING id, last_login_at
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

export async function upsertAdmin({ email, passwordHash, role = 'admin' }) {
  const sql = `
    INSERT INTO admins (email, password_hash, role, is_active)
    VALUES (LOWER($1), $2, $3, true)
    ON CONFLICT (email)
    DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, is_active = true
    RETURNING id, email, role
  `;
  const result = await query(sql, [email.toLowerCase().trim(), passwordHash, role]);
  return result.rows[0];
}
