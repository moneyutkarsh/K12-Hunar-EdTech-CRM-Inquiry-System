/**
 * Sanitizes a single CSV cell value to guard against CSV Formula Injection (DDE).
 * Prefixes cells beginning with =, +, -, @, \t, \r with a single quote (').
 * Escapes double quotes by doubling them ("").
 */
export function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // Guard against CSV formula injection
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Formats an array of objects into CSV string.
 */
export function formatCsv(columns, rows) {
  const headerLine = columns.map((col) => sanitizeCsvCell(col.header)).join(',');
  const dataLines = rows.map((row) =>
    columns.map((col) => sanitizeCsvCell(row[col.key])).join(',')
  );

  return [headerLine, ...dataLines].join('\r\n');
}

export default { sanitizeCsvCell, formatCsv };
