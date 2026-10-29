import { describe, it, expect } from 'vitest';
import { normalizePhone, isValidPhone } from '../../src/utils/phone.js';
import { escapeLikePattern } from '../../src/utils/likeEscape.js';
import { sanitizeCsvCell, formatCsv } from '../../src/utils/csv.js';
import { buildPaginationMeta } from '../../src/utils/pagination.js';

describe('Unit Tests: Utilities', () => {
  describe('Phone Normalization', () => {
    it('normalizes 10-digit Indian numbers starting with 6-9 with +91', () => {
      expect(normalizePhone('9876543210')).toBe('+919876543210');
      expect(normalizePhone('  88888 12345  ')).toBe('+918888812345');
    });

    it('preserves existing +91 and strips formatting', () => {
      expect(normalizePhone('+91 (987) 65-43210')).toBe('+919876543210');
    });

    it('validates plausibility of phone length', () => {
      expect(isValidPhone('9876543210')).toBe(true);
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('123456789012345678')).toBe(false);
    });
  });

  describe('LIKE Pattern Escaping', () => {
    it('escapes %, _, and backslash properly', () => {
      expect(escapeLikePattern('100% discount_offer\\')).toBe('100\\% discount\\_offer\\\\');
      expect(escapeLikePattern('normal text')).toBe('normal text');
    });
  });

  describe('CSV Sanitization & Formula Injection Guard', () => {
    it('prefixes formula injection characters with single quote', () => {
      expect(sanitizeCsvCell('=SUM(A1:A10)')).toBe('"\'=SUM(A1:A10)"');
      expect(sanitizeCsvCell('+cmd|')).toBe('"\'+cmd|"');
      expect(sanitizeCsvCell('-5+10')).toBe('"\'-5+10"');
      expect(sanitizeCsvCell('@macro')).toBe('"\'@macro"');
    });

    it('escapes double quotes by doubling them', () => {
      expect(sanitizeCsvCell('Hello "World"')).toBe('"Hello ""World"""');
    });

    it('formats full CSV with headers and rows correctly', () => {
      const cols = [
        { key: 'name', header: 'Name' },
        { key: 'role', header: 'Role' },
      ];
      const rows = [{ name: 'Aarav', role: 'Student' }];
      const csv = formatCsv(cols, rows);
      expect(csv).toContain('"Name","Role"');
      expect(csv).toContain('"Aarav","Student"');
    });
  });

  describe('Pagination Calculation', () => {
    it('calculates total pages, hasNext, hasPrev accurately', () => {
      const meta = buildPaginationMeta(1, 10, 25);
      expect(meta.totalPages).toBe(3);
      expect(meta.hasNext).toBe(true);
      expect(meta.hasPrev).toBe(false);

      const page2 = buildPaginationMeta(2, 10, 25);
      expect(page2.hasNext).toBe(true);
      expect(page2.hasPrev).toBe(true);

      const page3 = buildPaginationMeta(3, 10, 25);
      expect(page3.hasNext).toBe(false);
      expect(page3.hasPrev).toBe(true);
    });
  });
});
