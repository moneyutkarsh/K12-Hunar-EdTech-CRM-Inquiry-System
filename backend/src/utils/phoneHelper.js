/**
 * Normalizes phone number: strips formatting characters while preserving optional leading '+'
 * e.g. "+91 (987) 65-43210" -> "+919876543210"
 */
export function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}
