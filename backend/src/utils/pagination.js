export function buildPaginationMeta(page, limit, total) {
  const safeTotal = Math.max(0, parseInt(total || 0, 10));
  const safeLimit = Math.max(1, parseInt(limit || 10, 10));
  const safePage = Math.max(1, parseInt(page || 1, 10));
  const totalPages = Math.ceil(safeTotal / safeLimit) || 1;

  return {
    page: safePage,
    limit: safeLimit,
    total: safeTotal,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

export default buildPaginationMeta;
