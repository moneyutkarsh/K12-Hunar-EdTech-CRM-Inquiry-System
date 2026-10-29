/**
 * Sanitizes a cell string to protect against CSV Formula Injection (DDE).
 * If a cell begins with '=', '+', '-', or '@', it prefixes an apostrophe (').
 */
export function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // CSV Formula Injection mitigation
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Converts an array of objects into a sanitized CSV string.
 */
export function generateCsv(columns, rows) {
  const headerLine = columns.map((col) => sanitizeCsvCell(col.header)).join(',');
  const rowLines = rows.map((row) =>
    columns.map((col) => sanitizeCsvCell(row[col.key])).join(',')
  );

  return [headerLine, ...rowLines].join('\r\n');
}
