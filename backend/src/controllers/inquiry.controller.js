import { query } from '../config/db.js';
import { normalizePhone } from '../utils/phoneHelper.js';
import { generateCsv } from '../utils/csvHelper.js';

const ALLOWED_SORT_COLUMNS = {
  created_at: 'created_at',
  name: 'name',
  category: 'category',
  user_type: 'user_type',
  status: 'status',
};

// 1. Submit Public Inquiry
export const createInquiry = async (req, res) => {
  const { userType, category, name, email, phone, message } = req.body;
  const normalizedPhone = normalizePhone(phone);

  const insertQuery = `
    INSERT INTO inquiries (user_type, category, name, email, phone, message, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'New')
    RETURNING id, created_at
  `;

  const result = await query(insertQuery, [
    userType,
    category,
    name.trim(),
    email.toLowerCase().trim(),
    normalizedPhone,
    message.trim(),
  ]);

  const inserted = result.rows[0];

  return res.status(201).json({
    id: inserted.id,
    message: "Thank you! We have received your inquiry and our team will get back to you soon.",
  });
};

// Helper to build parameterized WHERE clause for inquiries
function buildWhereClause({ category, userType, status, search }) {
  const conditions = [];
  const params = [];

  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  if (userType) {
    params.push(userType);
    conditions.push(`user_type = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  if (search && search.trim().length > 0) {
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern);
    const p1 = params.length;

    // Search against name ILIKE or phone
    conditions.push(`(name ILIKE $${p1} OR phone ILIKE $${p1})`);
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereSql, params };
}

// 2. Get Inquiries (Paginated, Filtered, Sorted, Searched)
export const getInquiries = async (req, res) => {
  const { category, userType, status, search, page, limit, sort, order } = req.query;

  const { whereSql, params } = buildWhereClause({ category, userType, status, search });

  // Safe whitelisted sort column and order direction
  const sortCol = ALLOWED_SORT_COLUMNS[sort] || 'created_at';
  const sortDir = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // 1. Total Count Query
  const countSql = `SELECT COUNT(*) FROM inquiries ${whereSql}`;
  const countResult = await query(countSql, params);
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  // 2. Paginated Data Query
  const offset = (page - 1) * limit;
  const dataParams = [...params];
  dataParams.push(limit);
  const limitPlaceholder = `$${dataParams.length}`;
  dataParams.push(offset);
  const offsetPlaceholder = `$${dataParams.length}`;

  const dataSql = `
    SELECT id, user_type, category, name, email, phone, message, status, created_at, updated_at
    FROM inquiries
    ${whereSql}
    ORDER BY ${sortCol} ${sortDir}
    LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
  `;

  const dataResult = await query(dataSql, dataParams);
  const totalPages = Math.ceil(total / limit) || 1;

  return res.status(200).json({
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
};

// 3. Get Inquiry Stats (Total, New, In Progress, Resolved)
export const getStats = async (req, res) => {
  const statsSql = `
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'New') AS new_count,
      COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress_count,
      COUNT(*) FILTER (WHERE status = 'Resolved') AS resolved_count
    FROM inquiries
  `;

  const result = await query(statsSql, []);
  const row = result.rows[0] || {};

  return res.status(200).json({
    total: parseInt(row.total || '0', 10),
    new: parseInt(row.new_count || '0', 10),
    inProgress: parseInt(row.in_progress_count || '0', 10),
    resolved: parseInt(row.resolved_count || '0', 10),
  });
};

// 4. Export Inquiries as CSV
export const exportCsv = async (req, res) => {
  const { category, userType, status, search, sort, order } = req.query;

  const { whereSql, params } = buildWhereClause({ category, userType, status, search });
  const sortCol = ALLOWED_SORT_COLUMNS[sort] || 'created_at';
  const sortDir = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const exportSql = `
    SELECT id, user_type, category, name, email, phone, message, status, created_at
    FROM inquiries
    ${whereSql}
    ORDER BY ${sortCol} ${sortDir}
  `;

  const result = await query(exportSql, params);

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email' },
    { key: 'user_type', header: 'User Type' },
    { key: 'category', header: 'Category' },
    { key: 'status', header: 'Status' },
    { key: 'created_at', header: 'Date Submitted' },
    { key: 'message', header: 'Message' },
  ];

  const csvContent = generateCsv(columns, result.rows);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="k12_hunar_inquiries_${timestamp}.csv"`);
  return res.status(200).send(csvContent);
};

// 5. Update Status (PATCH)
export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const updateSql = `
    UPDATE inquiries
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, user_type, category, name, email, phone, message, status, created_at, updated_at
  `;

  const result = await query(updateSql, [status, id]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: {
        message: 'Inquiry not found',
      },
    });
  }

  return res.status(200).json({
    message: 'Status updated successfully',
    data: result.rows[0],
  });
};
