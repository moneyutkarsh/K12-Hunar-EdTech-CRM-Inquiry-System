import { query } from '../config/db.js';
import { escapeLikePattern } from '../utils/likeEscape.js';
import { generateReferenceCode } from '../utils/referenceCode.js';

const SORT_WHITELIST = {
  createdAt: 'created_at',
  created_at: 'created_at',
  name: 'name',
  status: 'status',
  priority: 'priority',
  category: 'category',
  userType: 'user_type',
  user_type: 'user_type',
};

export async function findDuplicateWithinWindow(email, category, message, windowMinutes = 10) {
  const sql = `
    SELECT id, reference_code, created_at
    FROM inquiries
    WHERE LOWER(email) = LOWER($1)
      AND category = $2
      AND message = $3
      AND created_at >= NOW() - ($4 || ' minutes')::INTERVAL
    ORDER BY created_at DESC
    LIMIT 1
  `;
  try {
    const result = await query(sql, [email.toLowerCase().trim(), category, message.trim(), windowMinutes]);
    return result.rows[0] || null;
  } catch (err) {
    return null;
  }
}

export async function createInquiryRow({ userType, category, name, email, phone, message, sourceIpHash }) {
  let attempts = 0;
  while (attempts < 5) {
    attempts++;
    const referenceCode = generateReferenceCode();
    const sql = `
      INSERT INTO inquiries (user_type, category, name, email, phone, message, status, priority, source_ip_hash, reference_code, created_at, updated_at)
      VALUES ($1, $2, $3, LOWER($4), $5, $6, 'New', 'Normal', $7, $8, NOW(), NOW())
      RETURNING id, reference_code, created_at
    `;
    try {
      const result = await query(sql, [userType, category, name.trim(), email.trim(), phone, message.trim(), sourceIpHash, referenceCode]);
      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        continue;
      }
      throw err;
    }
  }
}

export async function listInquiries({
  category,
  userType,
  status,
  priority,
  assignedTo,
  currentAdminId,
  search,
  from,
  to,
  sort = 'createdAt',
  order = 'desc',
  page = 1,
  limit = 10,
  ids,
}) {
  const conditions = [];
  const params = [];

  // Filter by specific IDs (e.g. for bulk export)
  if (ids) {
    const idList = (Array.isArray(ids) ? ids : ids.split(',')).map((id) => id.trim()).filter(Boolean);
    if (idList.length > 0) {
      const placeholders = idList.map((id) => {
        params.push(id);
        return `$${params.length}`;
      });
      conditions.push(`i.id IN (${placeholders.join(', ')})`);
    }
  }

  // 1. Category filter (supports comma-separated list)
  if (category) {
    const categories = category.split(',').map((c) => c.trim()).filter(Boolean);
    if (categories.length === 1) {
      params.push(categories[0]);
      conditions.push(`i.category = $${params.length}`);
    } else if (categories.length > 1) {
      const placeholders = categories.map((c) => {
        params.push(c);
        return `$${params.length}`;
      });
      conditions.push(`i.category IN (${placeholders.join(', ')})`);
    }
  }

  // 2. User Type filter (supports comma-separated list)
  if (userType) {
    const types = userType.split(',').map((t) => t.trim()).filter(Boolean);
    if (types.length === 1) {
      params.push(types[0]);
      conditions.push(`i.user_type = $${params.length}`);
    } else if (types.length > 1) {
      const placeholders = types.map((t) => {
        params.push(t);
        return `$${params.length}`;
      });
      conditions.push(`i.user_type IN (${placeholders.join(', ')})`);
    }
  }

  // 3. Status filter (supports comma-separated list)
  if (status) {
    const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length === 1) {
      params.push(statuses[0]);
      conditions.push(`i.status = $${params.length}`);
    } else if (statuses.length > 1) {
      const placeholders = statuses.map((s) => {
        params.push(s);
        return `$${params.length}`;
      });
      conditions.push(`i.status IN (${placeholders.join(', ')})`);
    }
  }

  // 4. Priority filter (supports comma-separated list)
  if (priority) {
    const priorities = priority.split(',').map((p) => p.trim()).filter(Boolean);
    if (priorities.length === 1) {
      params.push(priorities[0]);
      conditions.push(`i.priority = $${params.length}`);
    } else if (priorities.length > 1) {
      const placeholders = priorities.map((p) => {
        params.push(p);
        return `$${params.length}`;
      });
      conditions.push(`i.priority IN (${placeholders.join(', ')})`);
    }
  }

  // 5. AssignedTo filter ('unassigned', 'assigned', 'me', or UUID)
  if (assignedTo) {
    if (assignedTo === 'unassigned') {
      conditions.push(`i.assigned_to IS NULL`);
    } else if (assignedTo === 'assigned') {
      conditions.push(`i.assigned_to IS NOT NULL`);
    } else if (assignedTo === 'me' && currentAdminId) {
      params.push(currentAdminId);
      conditions.push(`i.assigned_to = $${params.length}`);
    } else {
      params.push(assignedTo);
      conditions.push(`i.assigned_to = $${params.length}`);
    }
  }

  // 6. Search filter: Name ILIKE (trigram) OR phone_digits LIKE OR reference_code ILIKE
  if (search && search.trim().length > 0) {
    const cleanSearch = search.trim();
    const escaped = escapeLikePattern(cleanSearch);
    const digitsOnly = cleanSearch.replace(/\D/g, '');

    params.push(`%${escaped}%`);
    const nameParamIdx = params.length;

    if (digitsOnly.length >= 2) {
      params.push(`%${digitsOnly}%`);
      const phoneParamIdx = params.length;
      conditions.push(`(i.name ILIKE $${nameParamIdx} OR i.reference_code ILIKE $${nameParamIdx} OR i.phone_digits LIKE $${phoneParamIdx} OR i.phone ILIKE $${nameParamIdx})`);
    } else {
      conditions.push(`(i.name ILIKE $${nameParamIdx} OR i.reference_code ILIKE $${nameParamIdx})`);
    }
  }

  // 7. Date Range filter (Asia/Kolkata timezone support)
  if (from) {
    params.push(from);
    conditions.push(`i.created_at >= ($${params.length}::TIMESTAMPTZ)`);
  }
  if (to) {
    params.push(to);
    conditions.push(`i.created_at <= ($${params.length}::TIMESTAMPTZ)`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortCol = SORT_WHITELIST[sort] || 'created_at';
  const sortDir = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const offset = (page - 1) * limit;
  params.push(limit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  // Single query using COUNT(*) OVER() with repeat-contact counter subquery
  const sql = `
    SELECT
      i.id, i.user_type, i.category, i.name, i.email, i.phone, i.message, i.status,
      i.priority, i.reference_code, i.assigned_to, i.created_at, i.updated_at,
      a.name AS assignee_name, a.email AS assignee_email, a.avatar_url AS assignee_avatar_url,
      (
        SELECT COUNT(*)
        FROM inquiries i2
        WHERE LOWER(i2.email) = LOWER(i.email)
           OR (i.phone_digits IS NOT NULL AND i2.phone_digits = i.phone_digits)
      ) AS contact_count,
      COUNT(*) OVER() AS total_count
    FROM inquiries i
    LEFT JOIN admins a ON i.assigned_to = a.id
    ${whereClause}
    ORDER BY i.${sortCol} ${sortDir}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const result = await query(sql, params);
  const rows = result.rows;
  const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;

  // Map to clean camelCase and snake_case DTOs for 100% frontend compatibility
  const data = rows.map((r) => ({
    id: r.id,
    referenceCode: r.reference_code,
    reference_code: r.reference_code,
    name: r.name,
    email: r.email,
    phone: r.phone,
    userType: r.user_type,
    user_type: r.user_type,
    category: r.category,
    status: r.status,
    priority: r.priority || 'Normal',
    assignedTo: r.assigned_to,
    assigned_to: r.assigned_to,
    assignee: r.assigned_to
      ? {
          id: r.assigned_to,
          name: r.assignee_name || r.assignee_email?.split('@')[0],
          email: r.assignee_email,
          avatarUrl: r.assignee_avatar_url || null,
        }
      : null,
    contactCount: parseInt(r.contact_count || '1', 10),
    contact_count: parseInt(r.contact_count || '1', 10),
    message: r.message,
    messagePreview: r.message.length > 140 ? `${r.message.slice(0, 137)}...` : r.message,
    createdAt: r.created_at,
    created_at: r.created_at,
    updatedAt: r.updated_at,
    updated_at: r.updated_at,
  }));

  return { data, total };
}

export async function findInquiryById(id) {
  const sql = `
    SELECT 
      i.id, i.user_type, i.category, i.name, i.email, i.phone, i.phone_digits, i.message, i.status,
      i.priority, i.reference_code, i.assigned_to, i.created_at, i.updated_at,
      a.name AS assignee_name, a.email AS assignee_email, a.avatar_url AS assignee_avatar_url
    FROM inquiries i
    LEFT JOIN admins a ON i.assigned_to = a.id
    WHERE i.id = $1
    LIMIT 1
  `;
  const result = await query(sql, [id]);
  const r = result.rows[0];
  if (!r) return null;

  // Find related inquiries from the same contact (by email or phone_digits), up to 5
  const relatedSql = `
    SELECT id, reference_code, category, status, priority, created_at
    FROM inquiries
    WHERE id != $1
      AND (
        LOWER(email) = LOWER($2)
        OR (phone_digits IS NOT NULL AND phone_digits = $3)
      )
    ORDER BY created_at DESC
    LIMIT 5
  `;
  const relatedResult = await query(relatedSql, [r.id, r.email, r.phone_digits]);
  const related = (relatedResult.rows || []).map((rel) => ({
    id: rel.id,
    referenceCode: rel.reference_code,
    reference_code: rel.reference_code,
    category: rel.category,
    status: rel.status,
    priority: rel.priority || 'Normal',
    createdAt: rel.created_at,
    created_at: rel.created_at,
  }));

  return {
    id: r.id,
    referenceCode: r.reference_code,
    reference_code: r.reference_code,
    name: r.name,
    email: r.email,
    phone: r.phone,
    userType: r.user_type,
    user_type: r.user_type,
    category: r.category,
    status: r.status,
    priority: r.priority || 'Normal',
    assignedTo: r.assigned_to,
    assigned_to: r.assigned_to,
    assignee: r.assigned_to
      ? {
          id: r.assigned_to,
          name: r.assignee_name || r.assignee_email?.split('@')[0],
          email: r.assignee_email,
          avatarUrl: r.assignee_avatar_url || null,
        }
      : null,
    contactCount: related.length + 1,
    contact_count: related.length + 1,
    related,
    message: r.message,
    createdAt: r.created_at,
    created_at: r.created_at,
    updatedAt: r.updated_at,
    updated_at: r.updated_at,
  };
}

export async function updateInquiryStatus(id, newStatus) {
  const sql = `
    UPDATE inquiries
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, user_type, category, name, email, phone, message, status, priority, reference_code, assigned_to, created_at, updated_at
  `;
  const result = await query(sql, [newStatus, id]);
  const r = result.rows[0];
  if (!r) return null;

  return {
    id: r.id,
    referenceCode: r.reference_code,
    reference_code: r.reference_code,
    name: r.name,
    email: r.email,
    phone: r.phone,
    userType: r.user_type,
    user_type: r.user_type,
    category: r.category,
    status: r.status,
    priority: r.priority,
    assignedTo: r.assigned_to,
    assigned_to: r.assigned_to,
    message: r.message,
    createdAt: r.created_at,
    created_at: r.created_at,
    updatedAt: r.updated_at,
    updated_at: r.updated_at,
  };
}

export async function updateInquiryPriority(id, newPriority) {
  const sql = `
    UPDATE inquiries
    SET priority = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, user_type, category, name, email, phone, message, status, priority, reference_code, assigned_to, created_at, updated_at
  `;
  const result = await query(sql, [newPriority, id]);
  const r = result.rows[0];
  if (!r) return null;

  return {
    id: r.id,
    referenceCode: r.reference_code,
    reference_code: r.reference_code,
    name: r.name,
    email: r.email,
    phone: r.phone,
    userType: r.user_type,
    user_type: r.user_type,
    category: r.category,
    status: r.status,
    priority: r.priority,
    assignedTo: r.assigned_to,
    assigned_to: r.assigned_to,
    message: r.message,
    createdAt: r.created_at,
    created_at: r.created_at,
    updatedAt: r.updated_at,
    updated_at: r.updated_at,
  };
}

export async function updateInquiryAssignee(id, adminId) {
  const sql = `
    UPDATE inquiries
    SET assigned_to = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, user_type, category, name, email, phone, message, status, priority, reference_code, assigned_to, created_at, updated_at
  `;
  const result = await query(sql, [adminId, id]);
  const r = result.rows[0];
  if (!r) return null;

  let assignee = null;
  if (r.assigned_to) {
    const adminRes = await query(`SELECT id, name, email, avatar_url FROM admins WHERE id = $1`, [r.assigned_to]);
    if (adminRes.rows[0]) {
      const adm = adminRes.rows[0];
      assignee = {
        id: adm.id,
        name: adm.name || adm.email.split('@')[0],
        email: adm.email,
        avatarUrl: adm.avatar_url,
      };
    }
  }

  return {
    id: r.id,
    referenceCode: r.reference_code,
    reference_code: r.reference_code,
    name: r.name,
    email: r.email,
    phone: r.phone,
    userType: r.user_type,
    user_type: r.user_type,
    category: r.category,
    status: r.status,
    priority: r.priority,
    assignedTo: r.assigned_to,
    assigned_to: r.assigned_to,
    assignee,
    message: r.message,
    createdAt: r.created_at,
    created_at: r.created_at,
    updatedAt: r.updated_at,
    updated_at: r.updated_at,
  };
}

export async function bulkUpdateInquiryStatus(ids, newStatus, adminId) {
  if (!ids || ids.length === 0) return 0;
  let count = 0;
  for (const id of ids) {
    const res = await query(
      `UPDATE inquiries SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
      [newStatus, id]
    );
    if (res.rowCount > 0) {
      count += res.rowCount;
      await query(
        `INSERT INTO activity_log (inquiry_id, admin_id, action, from_value, to_value, created_at)
         VALUES ($1, $2, 'status_changed', NULL, $3, NOW())`,
        [id, adminId, newStatus]
      );
    }
  }
  return count;
}

