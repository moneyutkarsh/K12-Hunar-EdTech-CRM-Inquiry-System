import { query } from '../config/db.js';

export async function createNote({ inquiryId, adminId, note }) {
  const sql = `
    INSERT INTO inquiry_notes (inquiry_id, admin_id, note, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING id, inquiry_id, admin_id, note, created_at
  `;
  const result = await query(sql, [inquiryId, adminId, note.trim()]);
  return result.rows[0];
}

export async function listNotesByInquiryId(inquiryId) {
  const sql = `
    SELECT n.id, n.inquiry_id, n.admin_id, n.note, n.created_at, a.email AS admin_email
    FROM inquiry_notes n
    JOIN admins a ON n.admin_id = a.id
    WHERE n.inquiry_id = $1
    ORDER BY n.created_at DESC
  `;
  try {
    const result = await query(sql, [inquiryId]);
    return result.rows;
  } catch (err) {
    return [];
  }
}
