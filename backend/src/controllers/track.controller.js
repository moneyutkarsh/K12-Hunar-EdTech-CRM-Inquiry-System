import { z } from 'zod';
import { query } from '../config/db.js';

const trackSchema = z
  .object({
    reference: z.string().min(3, 'Reference code is required').trim(),
    email: z.string().email('Valid email is required').trim(),
  })
  .strict();

/**
 * POST /api/track
 * Public inquiry tracker by reference code and registered email.
 * Strictly sanitized: returns only reference, category, status, timestamps, and public timeline.
 */
export async function trackInquiry(req, res, next) {
  try {
    const parseResult = trackSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid reference code or email format',
          details: parseResult.error.flatten(),
        },
      });
    }

    const { reference, email } = parseResult.data;
    const cleanRef = reference.toUpperCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    // Query inquiry matching both reference code and lower(email)
    const inquiryRes = await query(
      `SELECT id, reference_code, category, status, created_at, updated_at
       FROM inquiries
       WHERE reference_code = $1 AND LOWER(email) = LOWER($2)
       LIMIT 1`,
      [cleanRef, cleanEmail]
    );

    const row = inquiryRes.rows[0];
    if (!row) {
      // Generic 404 without leaking whether reference or email was the mismatch
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'No inquiry found for those details',
        },
      });
    }

    // Fetch public status timeline from activity_log
    const activityRes = await query(
      `SELECT action, from_value, to_value, created_at
       FROM activity_log
       WHERE inquiry_id = $1 AND action IN ('created', 'status_changed')
       ORDER BY created_at ASC`,
      [row.id]
    );

    const timeline = [];
    // Initial received event
    timeline.push({
      event: 'Received',
      label: 'Inquiry received and logged in system',
      timestamp: row.created_at,
    });

    for (const act of activityRes.rows || []) {
      if (act.action === 'status_changed') {
        if (act.to_value === 'In Progress') {
          timeline.push({
            event: 'In review',
            label: 'Assigned to counselor for active review',
            timestamp: act.created_at,
          });
        } else if (act.to_value === 'Resolved') {
          timeline.push({
            event: 'Resolved',
            label: 'Inquiry addressed and resolved',
            timestamp: act.created_at,
          });
        }
      }
    }

    return res.status(200).json({
      reference: row.reference_code,
      category: row.category,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      timeline,
    });
  } catch (err) {
    next(err);
  }
}
