import crypto from 'crypto';

// 32-character unambiguous alphabet excluding 0, O, 1, I, L
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generates an 8-character crypto-random reference code formatted as KH-XXXXXXXX
 * Excludes ambiguous characters (0, O, 1, I, L).
 */
export function generateReferenceCode() {
  const bytes = crypto.randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `KH-${code}`;
}

/**
 * Validates whether a given code matches the KH-XXXXXXXX format with unambiguous characters.
 */
export function isValidReferenceCode(code) {
  if (typeof code !== 'string') return false;
  return /^KH-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/i.test(code.trim());
}
