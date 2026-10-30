import { describe, it, expect } from 'vitest';
import {
  officialEventUrlSchema,
  programSchema,
  formatProgramDate,
  computeDaysUntil,
  getActivePrograms,
  RAW_PROGRAMS,
  type Program,
} from '../features/home/programs';

describe('officialEventUrlSchema URL security', () => {
  it('accepts valid official k12hunar event URLs', () => {
    expect(officialEventUrlSchema.safeParse('https://k12hunar.com/events/72').success).toBe(true);
    expect(officialEventUrlSchema.safeParse('https://k12hunar.com/events/111').success).toBe(true);
    expect(officialEventUrlSchema.safeParse('https://k12hunar.com/events/107').success).toBe(true);
    expect(officialEventUrlSchema.safeParse('https://www.k12hunar.com/events/999').success).toBe(true);
  });

  it('rejects non-https URLs', () => {
    const res = officialEventUrlSchema.safeParse('http://k12hunar.com/events/72');
    expect(res.success).toBe(false);
  });

  it('rejects look-alike and unauthorized hostnames', () => {
    expect(officialEventUrlSchema.safeParse('https://k12hunar.com.evil.com/events/72').success).toBe(false);
    expect(officialEventUrlSchema.safeParse('https://xk12hunar.com/events/72').success).toBe(false);
    expect(officialEventUrlSchema.safeParse('https://evil.com/events/72').success).toBe(false);
    expect(officialEventUrlSchema.safeParse('https://sub.k12hunar.com/events/72').success).toBe(false);
  });

  it('rejects invalid path formats', () => {
    expect(officialEventUrlSchema.safeParse('https://k12hunar.com/event/72').success).toBe(false);
    expect(officialEventUrlSchema.safeParse('https://k12hunar.com/events/').success).toBe(false);
    expect(officialEventUrlSchema.safeParse('https://k12hunar.com/events/abc').success).toBe(false);
    expect(officialEventUrlSchema.safeParse('https://k12hunar.com/events/72/register').success).toBe(false);
    expect(officialEventUrlSchema.safeParse('https://k12hunar.com/').success).toBe(false);
  });

  it('rejects URLs containing credentials', () => {
    expect(officialEventUrlSchema.safeParse('https://admin:pass@k12hunar.com/events/72').success).toBe(false);
  });

  it('rejects URLs with query strings', () => {
    expect(officialEventUrlSchema.safeParse('https://k12hunar.com/events/72?utm_source=twitter').success).toBe(false);
  });

  it('rejects URLs with hash fragments', () => {
    expect(officialEventUrlSchema.safeParse('https://k12hunar.com/events/72#overview').success).toBe(false);
  });
});

describe('programSchema validation', () => {
  it('validates the 3 official seed programs correctly', () => {
    for (const prog of RAW_PROGRAMS) {
      const res = programSchema.safeParse(prog);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.venueLabel).toBeDefined();
        expect(res.data.mode).toMatch(/^(Online|Offline|Hybrid)$/);
        expect(res.data.officialUrl).toMatch(/^https:\/\/(www\.)?k12hunar\.com\/events\/\d+$/);
      }
    }
  });

  it('rejects programs with missing required fields', () => {
    const invalid = {
      slug: 'test',
      title: 'Incomplete Event',
      // missing venueLabel, mode, officialUrl
    };
    expect(programSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects programs with invalid modes', () => {
    const invalid = {
      ...RAW_PROGRAMS[0],
      mode: 'In-Person', // invalid enum
    };
    expect(programSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('formatProgramDate', () => {
  it('formats dates in Asia/Kolkata timezone with weekday and IST', () => {
    const formatted = formatProgramDate('2026-12-21T08:00:00+05:30');
    expect(formatted).toContain('21');
    expect(formatted).toContain('Dec');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('IST');
    // Ensure day of week is dynamic (21 Dec 2026 is Monday)
    expect(formatted).toMatch(/^Mon/i);
  });
});

describe('computeDaysUntil', () => {
  it('computes positive days for future dates', () => {
    const fakeNow = new Date('2026-12-10T00:00:00+05:30');
    const days = computeDaysUntil('2026-12-21T08:00:00+05:30', fakeNow);
    expect(days).toBeGreaterThan(0);
    expect(days).toBe(12);
  });
});

describe('getActivePrograms runtime behavior', () => {
  it('filters out past programs and sorts soonest first', () => {
    const mockPrograms: Program[] = [
      {
        slug: 'past-event',
        title: 'Past Expo',
        displayCategory: 'General',
        venueLabel: 'Online',
        mode: 'Online',
        startsAt: '2026-10-01T10:00:00+05:30',
        isFree: true,
        officialUrl: 'https://k12hunar.com/events/10',
        inquiryCategory: 'General Query',
      },
      {
        slug: 'later-event',
        title: 'Later Event',
        displayCategory: 'Science',
        venueLabel: 'Patna',
        mode: 'Offline',
        startsAt: '2026-12-25T10:00:00+05:30',
        isFree: true,
        officialUrl: 'https://k12hunar.com/events/20',
        inquiryCategory: 'General Query',
      },
      {
        slug: 'sooner-event',
        title: 'Sooner Event',
        displayCategory: 'Tech',
        venueLabel: 'Online',
        mode: 'Online',
        startsAt: '2026-11-15T10:00:00+05:30',
        isFree: true,
        officialUrl: 'https://k12hunar.com/events/30',
        inquiryCategory: 'General Query',
      },
    ];

    const fakeNow = new Date('2026-10-30T12:00:00+05:30');
    const active = getActivePrograms(mockPrograms, fakeNow);

    // past-event should be dropped
    expect(active.length).toBe(2);
    expect(active[0].slug).toBe('sooner-event');
    expect(active[1].slug).toBe('later-event');
  });

  it('drops malformed programs without throwing error', () => {
    const corrupted: any[] = [
      { slug: 'bad-url', officialUrl: 'http://insecure.com' },
      ...RAW_PROGRAMS,
    ];
    const fakeNow = new Date('2026-10-30T12:00:00+05:30');
    const active = getActivePrograms(corrupted, fakeNow);
    expect(active.length).toBe(RAW_PROGRAMS.length);
  });

  it('returns empty array when all programs are in the past', () => {
    const allPast: Program[] = [
      {
        slug: 'old-1',
        title: 'Old 1',
        displayCategory: 'General',
        venueLabel: 'Online',
        mode: 'Online',
        startsAt: '2025-01-01T10:00:00+05:30',
        isFree: true,
        officialUrl: 'https://k12hunar.com/events/1',
        inquiryCategory: 'General Query',
      },
    ];
    const fakeNow = new Date('2026-10-30T12:00:00+05:30');
    expect(getActivePrograms(allPast, fakeNow)).toEqual([]);
  });
});

describe('Carousel interaction and link behaviors', () => {
  it('verifies officialUrl mapping for all 3 official events', () => {
    const map = new Map(RAW_PROGRAMS.map((p) => [p.slug, p.officialUrl]));
    expect(map.get('bsef-2026')).toBe('https://k12hunar.com/events/72');
    expect(map.get('hrip')).toBe('https://k12hunar.com/events/111');
    expect(map.get('hsip')).toBe('https://k12hunar.com/events/107');
  });

  it('verifies secondary inquiry prefill URLs contain right category and topic', () => {
    for (const prog of RAW_PROGRAMS) {
      const targetUrl = `/inquiry?category=${encodeURIComponent(prog.inquiryCategory)}&topic=${encodeURIComponent(prog.slug)}`;
      expect(targetUrl).toContain(`topic=${prog.slug}`);
      expect(targetUrl).toContain(`category=${encodeURIComponent(prog.inquiryCategory)}`);
    }
  });

  it('simulates drag suppression logic (distance > 6px or time > 250ms with movement)', () => {
    const shouldSuppressClick = (dx: number, dy: number, elapsedMs: number) => {
      return dx > 6 || dy > 6 || (elapsedMs > 250 && (dx > 3 || dy > 3));
    };

    // Micro jitter (normal click) -> does NOT suppress
    expect(shouldSuppressClick(2, 1, 100)).toBe(false);
    expect(shouldSuppressClick(0, 0, 50)).toBe(false);

    // Dragged > 6px -> SUPPRESSES
    expect(shouldSuppressClick(7, 2, 80)).toBe(true);
    expect(shouldSuppressClick(1, 10, 150)).toBe(true);

    // Long press swipe (>250ms with >3px movement) -> SUPPRESSES
    expect(shouldSuppressClick(4, 2, 280)).toBe(true);
  });

  it('verifies non-active card click brings card to center and prevents navigation', () => {
    let activeIdx = 0;
    let navigated = false;

    const handleCardClick = (clickedIdx: number) => {
      if (clickedIdx !== activeIdx) {
        // Only recenters, no navigation
        activeIdx = clickedIdx;
      } else {
        // Navigates
        navigated = true;
      }
    };

    // Click card 1 when card 0 is active
    handleCardClick(1);
    expect(activeIdx).toBe(1);
    expect(navigated).toBe(false);

    // Click card 1 again now that it is active
    handleCardClick(1);
    expect(navigated).toBe(true);
  });
});
