import { query } from '../config/db.js';

export async function getStats() {
  const sql = `
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'New') AS new_count,
      COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress_count,
      COUNT(*) FILTER (WHERE status = 'Resolved') AS resolved_count,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS last_24h,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS last_7d
    FROM inquiries
  `;
  const result = await query(sql);
  const row = result.rows[0] || {};

  const newCount = parseInt(row.new_count || 0, 10);
  const inProgressCount = parseInt(row.in_progress_count || 0, 10);
  const resolvedCount = parseInt(row.resolved_count || 0, 10);
  const totalCount = parseInt(row.total || 0, 10);

  return {
    total: totalCount,
    new: newCount,
    inProgress: inProgressCount,
    resolved: resolvedCount,
    byStatus: {
      New: newCount,
      InProgress: inProgressCount,
      Resolved: resolvedCount,
    },
    last24h: parseInt(row.last_24h || 0, 10),
    last7d: parseInt(row.last_7d || 0, 10),
  };
}

export async function getAnalytics() {
  // 1. Daily inquiries for the last 30 days zero-filled with generate_series
  const dailySql = `
    WITH date_range AS (
      SELECT generate_series(
        date_trunc('day', NOW() - INTERVAL '29 days'),
        date_trunc('day', NOW()),
        INTERVAL '1 day'
      ) AS day
    )
    SELECT
      to_char(dr.day, 'YYYY-MM-DD') AS date,
      COUNT(i.id) AS count
    FROM date_range dr
    LEFT JOIN inquiries i ON date_trunc('day', i.created_at) = dr.day
    GROUP BY dr.day
    ORDER BY dr.day ASC
  `;

  // 2. Breakdown by category
  const categorySql = `
    SELECT category, COUNT(*) AS count
    FROM inquiries
    GROUP BY category
    ORDER BY count DESC
  `;

  // 3. Breakdown by user type
  const userTypeSql = `
    SELECT user_type AS "userType", COUNT(*) AS count
    FROM inquiries
    GROUP BY user_type
    ORDER BY count DESC
  `;

  // 4. Breakdown by status
  const statusSql = `
    SELECT status, COUNT(*) AS count
    FROM inquiries
    GROUP BY status
    ORDER BY count DESC
  `;

  const [dailyRes, catRes, userRes, statRes] = await Promise.all([
    query(dailySql),
    query(categorySql),
    query(userTypeSql),
    query(statusSql),
  ]);

  return {
    daily: dailyRes.rows.map((r) => ({ date: r.date, count: parseInt(r.count, 10) })),
    byCategory: catRes.rows.map((r) => ({ category: r.category, count: parseInt(r.count, 10) })),
    byUserType: userRes.rows.map((r) => ({ userType: r.userType, count: parseInt(r.count, 10) })),
    byStatus: statRes.rows.map((r) => ({ status: r.status, count: parseInt(r.count, 10) })),
  };
}

export default { getStats, getAnalytics };
