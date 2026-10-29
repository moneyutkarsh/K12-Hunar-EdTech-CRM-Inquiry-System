import { query } from '../config/db.js';

export async function logActivity({ inquiryId, adminId = null, action, fromValue = null, toValue = null }) {
  const sql = `
    INSERT INTO activity_log (inquiry_id, admin_id, action, from_value, to_value, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING id, inquiry_id, admin_id, action, from_value, to_value, created_at
  `;
  try {
    const result = await query(sql, [inquiryId, adminId, action, fromValue, toValue]);
    return result.rows[0];
  } catch (err) {
    return { id: null };
  }
}

export async function listActivityByInquiryId(inquiryId) {
  const sql = `
    SELECT al.id, al.inquiry_id, al.admin_id, al.action, al.from_value, al.to_value, al.created_at,
           a.email AS admin_email
    FROM activity_log al
    LEFT JOIN admins a ON al.admin_id = a.id
    WHERE al.inquiry_id = $1
    ORDER BY al.created_at DESC
  `;
  try {
    const result = await query(sql, [inquiryId]);
    return (result.rows || []).map((r) => ({
      id: r.id,
      inquiryId: r.inquiry_id,
      inquiry_id: r.inquiry_id,
      adminId: r.admin_id,
      admin_id: r.admin_id,
      adminEmail: r.admin_email,
      admin_email: r.admin_email,
      action: r.action,
      fromValue: r.from_value,
      from_value: r.from_value,
      toValue: r.to_value,
      to_value: r.to_value,
      createdAt: r.created_at,
      created_at: r.created_at,
    }));
  } catch (err) {
    return [];
  }
}
