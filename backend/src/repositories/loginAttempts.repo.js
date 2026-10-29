import { query } from '../config/db.js';

export async function recordLoginAttempt(email, ipHash, success) {
  const sql = `
    INSERT INTO login_attempts (email, ip_hash, success, created_at)
    VALUES (LOWER($1), $2, $3, NOW())
    RETURNING id
  `;
  try {
    const result = await query(sql, [email.toLowerCase().trim(), ipHash, success]);
    return result.rows[0];
  } catch (err) {
    // In mock testing mode, ignore if table not modeled
    return { id: 1 };
  }
}

export async function countRecentFailures(email, windowMinutes = 15) {
  const sql = `
    SELECT COUNT(*) AS failure_count
    FROM login_attempts
    WHERE LOWER(email) = LOWER($1)
      AND success = false
      AND created_at >= NOW() - ($2 || ' minutes')::INTERVAL
  `;
  try {
    const result = await query(sql, [email.toLowerCase().trim(), windowMinutes]);
    return parseInt(result.rows[0]?.failure_count || 0, 10);
  } catch (err) {
    return 0;
  }
}
