/**
 * Escapes characters with special meaning in SQL LIKE / ILIKE patterns: '%', '_', and '\'.
 */
export function escapeLikePattern(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/([%_\\])/g, '\\$1');
}

export default escapeLikePattern;
