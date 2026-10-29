import { query } from '../config/db.js';
import { escapeLikePattern } from '../utils/likeEscape.js';

const SORT_WHITELIST = {
  createdAt: 'created_at',
  name: 'name',
  status: 'status',
  category: 'category',
  userType: 'user_type',
};

export async function findDuplicateWithinWindow(email, category, message, windowMinutes = 10) {
  const sql = `
    SELECT id, created_at
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
  const sql = `
    INSERT INTO inquiries (user_type, category, name, email, phone, message, status, source_ip_hash, created_at, updated_at)
    VALUES ($1, $2, $3, LOWER($4), $5, $6, 'New', $7, NOW(), NOW())
    RETURNING id, created_at
  `;
  const result = await query(sql, [userType, category, name.trim(), email.trim(), phone, message.trim(), sourceIpHash]);
  return result.rows[0];
}

export async function listInquiries({
  category,
  userType,
  status,
  search,
  from,
  to,
  sort = 'createdAt',
  order = 'desc',
  page = 1,
  limit = 10,
}) {
  const conditions = [];
  const params = [];

  // 1. Category filter (supports comma-separated list)
  if (category) {
    const categories = category.split(',').map((c) => c.trim()).filter(Boolean);
    if (categories.length === 1) {
      params.push(categories[0]);
      conditions.push(`category = $${params.length}`);
    } else if (categories.length > 1) {
      const placeholders = categories.map((c) => {
        params.push(c);
        return `$${params.length}`;
      });
      conditions.push(`category IN (${placeholders.join(', ')})`);
    }
  }

  // 2. User Type filter (supports comma-separated list)
  if (userType) {
    const types = userType.split(',').map((t) => t.trim()).filter(Boolean);
    if (types.length === 1) {
      params.push(types[0]);
      conditions.push(`user_type = $${params.length}`);
    } else if (types.length > 1) {
      const placeholders = types.map((t) => {
        params.push(t);
        return `$${params.length}`;
      });
      conditions.push(`user_type IN (${placeholders.join(', ')})`);
    }
  }

  // 3. Status filter (supports comma-separated list)
  if (status) {
    const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length === 1) {
      params.push(statuses[0]);
      conditions.push(`status = $${params.length}`);
    } else if (statuses.length > 1) {
      const placeholders = statuses.map((s) => {
        params.push(s);
        return `$${params.length}`;
      });
      conditions.push(`status IN (${placeholders.join(', ')})`);
    }
  }

  // 4. Search filter: Name ILIKE (trigram) OR phone_digits LIKE
  if (search && search.trim().length > 0) {
    const cleanSearch = search.trim();
    const escaped = escapeLikePattern(cleanSearch);
    const digitsOnly = cleanSearch.replace(/\D/g, '');

    params.push(`%${escaped}%`);
    const nameParamIdx = params.length;

    if (digitsOnly.length >= 2) {
      params.push(`%${digitsOnly}%`);
      const phoneParamIdx = params.length;
      conditions.push(`(name ILIKE $${nameParamIdx} OR phone_digits LIKE $${phoneParamIdx} OR phone ILIKE $${nameParamIdx})`);
    } else {
      conditions.push(`name ILIKE $${nameParamIdx}`);
    }
  }

  // 5. Date Range filter (Asia/Kolkata timezone support)
  if (from) {
    params.push(from);
    conditions.push(`created_at >= ($${params.length}::TIMESTAMPTZ)`);
  }
  if (to) {
    params.push(to);
    conditions.push(`created_at <= ($${params.length}::TIMESTAMPTZ)`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortCol = SORT_WHITELIST[sort] || 'created_at';
  const sortDir = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const offset = (page - 1) * limit;
  params.push(limit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  // Single query using COUNT(*) OVER() for optimal performance without two roundtrips
  const sql = `
    SELECT
      id, user_type, category, name, email, phone, message, status, created_at, updated_at,
      COUNT(*) OVER() AS total_count
    FROM inquiries
    ${whereClause}
    ORDER BY ${sortCol} ${sortDir}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const result = await query(sql, params);
  const rows = result.rows;
  const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;

  // Map to clean camelCase DTOs
  const data = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    userType: r.user_type,
    category: r.category,
    status: r.status,
    message: r.message,
    messagePreview: r.message.length > 140 ? `${r.message.slice(0, 137)}...` : r.message,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return { data, total };
}

export async function findInquiryById(id) {
  const sql = `
    SELECT id, user_type, category, name, email, phone, message, status, created_at, updated_at
    FROM inquiries
    WHERE id = $1
    LIMIT 1
  `;
  const result = await query(sql, [id]);
  const r = result.rows[0];
  if (!r) return null;

  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    userType: r.user_type,
    category: r.category,
    status: r.status,
    message: r.message,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function updateInquiryStatus(id, newStatus) {
  const sql = `
    UPDATE inquiries
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, user_type, category, name, email, phone, message, status, created_at, updated_at
  `;
  const result = await query(sql, [newStatus, id]);
  const r = result.rows[0];
  if (!r) return null;

  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    userType: r.user_type,
    category: r.category,
    status: r.status,
    message: r.message,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
