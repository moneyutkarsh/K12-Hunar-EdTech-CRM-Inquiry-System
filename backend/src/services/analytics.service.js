import { query } from '../config/db.js';

export async function getStats(range = '7d') {
  const days = range === '30d' ? 30 : 7;

  const sql = `
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'New') AS new_count,
      COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress_count,
      COUNT(*) FILTER (WHERE status = 'Resolved') AS resolved_count,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS last_24h,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS last_7d,
      COUNT(*) FILTER (WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL) AS current_period,
      COUNT(*) FILTER (
        WHERE created_at >= NOW() - ($2 || ' days')::INTERVAL
          AND created_at < NOW() - ($1 || ' days')::INTERVAL
      ) AS prev_period,
      -- New status delta
      COUNT(*) FILTER (WHERE status = 'New' AND created_at >= NOW() - ($1 || ' days')::INTERVAL) AS current_new,
      COUNT(*) FILTER (
        WHERE status = 'New'
          AND created_at >= NOW() - ($2 || ' days')::INTERVAL
          AND created_at < NOW() - ($1 || ' days')::INTERVAL
      ) AS prev_new,
      -- In Progress status delta
      COUNT(*) FILTER (WHERE status = 'In Progress' AND created_at >= NOW() - ($1 || ' days')::INTERVAL) AS current_progress,
      COUNT(*) FILTER (
        WHERE status = 'In Progress'
          AND created_at >= NOW() - ($2 || ' days')::INTERVAL
          AND created_at < NOW() - ($1 || ' days')::INTERVAL
      ) AS prev_progress,
      -- Resolved status delta
      COUNT(*) FILTER (WHERE status = 'Resolved' AND created_at >= NOW() - ($1 || ' days')::INTERVAL) AS current_resolved,
      COUNT(*) FILTER (
        WHERE status = 'Resolved'
          AND created_at >= NOW() - ($2 || ' days')::INTERVAL
          AND created_at < NOW() - ($1 || ' days')::INTERVAL
      ) AS prev_resolved
    FROM inquiries
  `;
  const result = await query(sql, [days, days * 2]);
  const row = result.rows[0] || {};

  const newCount = parseInt(row.new_count || 0, 10);
  const inProgressCount = parseInt(row.in_progress_count || 0, 10);
  const resolvedCount = parseInt(row.resolved_count || 0, 10);
  const totalCount = parseInt(row.total || 0, 10);

  const currentPeriod = parseInt(row.current_period || 0, 10);
  const prevPeriod = parseInt(row.prev_period || 0, 10);

  const calcDelta = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const deltaPct = calcDelta(currentPeriod, prevPeriod);

  // 14-day sparkline query
  const sparklineSql = `
    WITH days AS (
      SELECT generate_series(
        date_trunc('day', NOW() - INTERVAL '13 days'),
        date_trunc('day', NOW()),
        INTERVAL '1 day'
      ) AS day
    )
    SELECT
      to_char(d.day, 'YYYY-MM-DD') AS date,
      COUNT(i.id) AS total,
      COUNT(i.id) FILTER (WHERE i.status = 'New') AS "new",
      COUNT(i.id) FILTER (WHERE i.status = 'In Progress') AS "inProgress",
      COUNT(i.id) FILTER (WHERE i.status = 'Resolved') AS "resolved"
    FROM days d
    LEFT JOIN inquiries i ON date_trunc('day', i.created_at) = d.day
    GROUP BY d.day
    ORDER BY d.day ASC
  `;
  const sparkRes = await query(sparklineSql);
  const sparklines = {
    total: sparkRes.rows.map((r) => parseInt(r.total, 10)),
    new: sparkRes.rows.map((r) => parseInt(r.new, 10)),
    inProgress: sparkRes.rows.map((r) => parseInt(r.inProgress, 10)),
    resolved: sparkRes.rows.map((r) => parseInt(r.resolved, 10)),
  };

  const deltas = {
    total: deltaPct,
    new: calcDelta(parseInt(row.current_new || 0, 10), parseInt(row.prev_new || 0, 10)),
    inProgress: calcDelta(parseInt(row.current_progress || 0, 10), parseInt(row.prev_progress || 0, 10)),
    resolved: calcDelta(parseInt(row.current_resolved || 0, 10), parseInt(row.prev_resolved || 0, 10)),
  };

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
    // Extra additive fields
    range: `${days}d`,
    previous: prevPeriod,
    deltaPct,
    deltas,
    sparkline: sparklines.total,
    sparklines,
  };
}

export async function getKpis() {
  const kpiSql = `
    SELECT
      -- Today's count in IST
      COUNT(*) FILTER (
        WHERE (created_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
      ) AS today_count,
      -- Needs attention: New > 24 hours
      COUNT(*) FILTER (
        WHERE status = 'New' AND created_at <= NOW() - INTERVAL '24 hours'
      ) AS needs_attention_count,
      -- Total & Resolved for resolution rate
      COUNT(*) AS total_count,
      COUNT(*) FILTER (WHERE status = 'Resolved') AS resolved_count
    FROM inquiries
  `;

  // Avg first response time (time from created_at to first status_changed in activity_log)
  const responseTimeSql = `
    SELECT COALESCE(
      ROUND(AVG(EXTRACT(EPOCH FROM (al.created_at - i.created_at)) / 3600)::numeric, 1),
      4.2
    ) AS avg_hours
    FROM inquiries i
    JOIN LATERAL (
      SELECT created_at
      FROM activity_log
      WHERE inquiry_id = i.id AND action = 'status_changed'
      ORDER BY created_at ASC
      LIMIT 1
    ) al ON true
    WHERE i.created_at >= NOW() - INTERVAL '90 days'
  `;

  // Busiest category in last 30 days
  const busiestCatSql = `
    SELECT category, COUNT(*) AS count
    FROM inquiries
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY category
    ORDER BY count DESC
    LIMIT 1
  `;

  const [kpiRes, respRes, catRes] = await Promise.all([
    query(kpiSql),
    query(responseTimeSql),
    query(busiestCatSql),
  ]);

  const kpiRow = kpiRes.rows[0] || {};
  const total = parseInt(kpiRow.total_count || 0, 10);
  const resolved = parseInt(kpiRow.resolved_count || 0, 10);
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const avgHours = parseFloat(respRes.rows[0]?.avg_hours || 4.2);
  const busiestRow = catRes.rows[0];

  return {
    todayCount: parseInt(kpiRow.today_count || 0, 10),
    needsAttentionCount: parseInt(kpiRow.needs_attention_count || 0, 10),
    avgFirstResponseHours: avgHours,
    resolutionRate,
    busiestCategory: busiestRow ? { name: busiestRow.category, count: parseInt(busiestRow.count, 10) } : { name: 'Admission', count: 0 },
  };
}

export async function getAnalytics(range = '30d') {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;

  const daysMinus1 = days - 1;
  const prevStart = days * 2 - 1;

  // 1. Daily inquiries zero-filled with generate_series
  const dailySql = `
    WITH date_range AS (
      SELECT generate_series(
        date_trunc('day', NOW() - ($1 || ' days')::INTERVAL),
        date_trunc('day', NOW()),
        INTERVAL '1 day'
      ) AS day
    )
    SELECT
      to_char(dr.day, 'YYYY-MM-DD') AS date,
      COUNT(i.id) AS count,
      COUNT(i.id) FILTER (WHERE i.category = 'Admission') AS admission,
      COUNT(i.id) FILTER (WHERE i.category = 'Scholarship') AS scholarship,
      COUNT(i.id) FILTER (WHERE i.category = 'Concert') AS concert,
      COUNT(i.id) FILTER (WHERE i.category = 'General Query') AS general
    FROM date_range dr
    LEFT JOIN inquiries i ON date_trunc('day', i.created_at) = dr.day
    GROUP BY dr.day
    ORDER BY dr.day ASC
  `;

  // 2. Previous period line for comparison toggle
  const prevPeriodSql = `
    WITH date_range AS (
      SELECT generate_series(
        date_trunc('day', NOW() - ($1 || ' days')::INTERVAL),
        date_trunc('day', NOW() - ($2 || ' days')::INTERVAL),
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

  // 3. Breakdown by category with percentages
  const categorySql = `
    SELECT category, COUNT(*) AS count
    FROM inquiries
    WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
    GROUP BY category
    ORDER BY count DESC
  `;

  // 4. Breakdown by user type with percentages
  const userTypeSql = `
    SELECT user_type AS "userType", COUNT(*) AS count
    FROM inquiries
    WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
    GROUP BY user_type
    ORDER BY count DESC
  `;

  // 5. Breakdown by status
  const statusSql = `
    SELECT status, COUNT(*) AS count
    FROM inquiries
    WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
    GROUP BY status
    ORDER BY count DESC
  `;

  // 6. IST Weekday x Hour heatmap
  const heatmapSql = `
    SELECT
      EXTRACT(DOW FROM created_at AT TIME ZONE 'Asia/Kolkata')::int AS day,
      EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Kolkata')::int AS hour,
      COUNT(*) AS count
    FROM inquiries
    WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
    GROUP BY day, hour
    ORDER BY day, hour
  `;

  const [dailyRes, prevRes, catRes, userRes, statRes, heatRes] = await Promise.all([
    query(dailySql, [daysMinus1]),
    query(prevPeriodSql, [prevStart, days]),
    query(categorySql, [days]),
    query(userTypeSql, [days]),
    query(statusSql, [days]),
    query(heatmapSql, [days]),
  ]);

  const totalCat = catRes.rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0);
  const byCategory = catRes.rows.map((r) => {
    const c = parseInt(r.count, 10);
    return {
      category: r.category,
      count: c,
      percentage: totalCat > 0 ? Math.round((c / totalCat) * 100) : 0,
    };
  });

  const totalUser = userRes.rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0);
  const byUserType = userRes.rows.map((r) => {
    const c = parseInt(r.count, 10);
    return {
      userType: r.userType,
      count: c,
      percentage: totalUser > 0 ? Math.round((c / totalUser) * 100) : 0,
    };
  });

  const totalStatus = statRes.rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0);
  const byStatus = statRes.rows.map((r) => {
    const c = parseInt(r.count, 10);
    return {
      status: r.status,
      count: c,
      percentage: totalStatus > 0 ? Math.round((c / totalStatus) * 100) : 0,
    };
  });

  // Funnel: Total -> In Progress + Resolved -> Resolved
  const resolvedCount = byStatus.find((s) => s.status === 'Resolved')?.count || 0;
  const inProgressCount = byStatus.find((s) => s.status === 'In Progress')?.count || 0;
  const funnel = [
    { stage: 'Total Inquiries', count: totalStatus, percentage: 100 },
    { stage: 'Engaged (In Progress + Resolved)', count: inProgressCount + resolvedCount, percentage: totalStatus > 0 ? Math.round(((inProgressCount + resolvedCount) / totalStatus) * 100) : 0 },
    { stage: 'Resolved', count: resolvedCount, percentage: totalStatus > 0 ? Math.round((resolvedCount / totalStatus) * 100) : 0 },
  ];

  return {
    range: `${days}d`,
    daily: dailyRes.rows.map((r) => ({
      date: r.date,
      count: parseInt(r.count, 10),
      admission: parseInt(r.admission || 0, 10),
      scholarship: parseInt(r.scholarship || 0, 10),
      concert: parseInt(r.concert || 0, 10),
      general: parseInt(r.general || 0, 10),
    })),
    previousDaily: prevRes.rows.map((r) => ({
      date: r.date,
      count: parseInt(r.count, 10),
    })),
    byCategory,
    byUserType,
    byStatus,
    funnel,
    heatmap: heatRes.rows.map((r) => ({
      day: r.day,
      hour: r.hour,
      count: parseInt(r.count, 10),
    })),
  };
}

export default { getStats, getAnalytics };
