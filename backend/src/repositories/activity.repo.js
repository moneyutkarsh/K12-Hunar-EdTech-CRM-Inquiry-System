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

export async function listActivityFeed({ cursor = null, limit = 20, action = null, inquiryId = null } = {}) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const conditions = [];
  const params = [];

  if (cursor) {
    params.push(cursor);
    conditions.push(`al.created_at < $${params.length}`);
  }

  if (action) {
    let normalizedAction = action.trim();
    if (normalizedAction === 'status') normalizedAction = 'status_changed';
    if (normalizedAction === 'priority') normalizedAction = 'priority_changed';
    if (normalizedAction === 'assign' || normalizedAction === 'assignment') normalizedAction = 'assigned';
    if (normalizedAction === 'note' || normalizedAction === 'notes') normalizedAction = 'note_added';
    params.push(normalizedAction);
    conditions.push(`al.action = $${params.length}`);
  }

  if (inquiryId) {
    params.push(inquiryId);
    conditions.push(`al.inquiry_id = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(safeLimit + 1);
  const limitIndex = params.length;

  const sql = `
    SELECT al.id, al.inquiry_id, al.admin_id, al.action, al.from_value, al.to_value, al.created_at,
           a.id AS actor_id, a.name AS actor_name, a.email AS actor_email, a.avatar_url AS actor_avatar_url,
           i.reference_code, i.name AS inquiry_name, i.email AS inquiry_email, i.category AS inquiry_category,
           i.user_type AS inquiry_user_type, i.status AS inquiry_status, i.priority AS inquiry_priority
    FROM activity_log al
    LEFT JOIN admins a ON al.admin_id = a.id
    JOIN inquiries i ON al.inquiry_id = i.id
    ${whereClause}
    ORDER BY al.created_at DESC, al.id DESC
    LIMIT $${limitIndex}
  `;

  const result = await query(sql, params);
  const rows = result.rows || [];
  const hasMore = rows.length > safeLimit;
  const items = hasMore ? rows.slice(0, safeLimit) : rows;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].created_at.toISOString() : null;

  return {
    items: items.map((r) => ({
      id: r.id,
      inquiryId: r.inquiry_id,
      action: r.action,
      fromValue: r.from_value,
      toValue: r.to_value,
      createdAt: r.created_at,
      actor: r.admin_id
        ? {
            id: r.actor_id,
            name: r.actor_name || r.actor_email.split('@')[0],
            email: r.actor_email,
            avatarUrl: r.actor_avatar_url || null,
          }
        : null,
      inquiry: {
        id: r.inquiry_id,
        referenceCode: r.reference_code,
        name: r.inquiry_name,
        email: r.inquiry_email,
        category: r.inquiry_category,
        userType: r.inquiry_user_type,
        status: r.inquiry_status,
        priority: r.inquiry_priority,
      },
    })),
    nextCursor,
    hasMore,
  };
}

