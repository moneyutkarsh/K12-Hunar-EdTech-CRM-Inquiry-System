/**
 * Normalizes phone input into standardized format.
 * - If 10-digit Indian mobile starting with 6-9, prefixes '+91'.
 * - If already formatted with '+91' or country code, strips whitespace/symbols.
 */
export function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const trimmed = phone.trim();

  // Strip non-digit characters except leading plus
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (!hasPlus && digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
    return `+91${digitsOnly}`;
  }

  if (hasPlus) {
    return `+${digitsOnly}`;
  }

  // If starts with 91 and has 12 digits
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+${digitsOnly}`;
  }

  return `+${digitsOnly}`;
}

/**
 * Validates whether string is a plausible phone number (8 to 15 digits)
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}
