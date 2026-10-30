import { z } from 'zod';

export type ProgramMode = 'Online' | 'Offline' | 'Hybrid';

// Strict URL validator for official k12hunar event links
export const officialEventUrlSchema = z.string().superRefine((val, ctx) => {
  let parsed: URL;
  try {
    parsed = new URL(val);
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid URL format',
    });
    return;
  }

  // 1. Protocol must be https
  if (parsed.protocol !== 'https:') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Protocol must be https',
    });
  }

  // 2. Hostname must be exactly k12hunar.com or www.k12hunar.com
  const validHosts = ['k12hunar.com', 'www.k12hunar.com'];
  if (!validHosts.includes(parsed.hostname.toLowerCase())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Hostname must be exactly k12hunar.com or www.k12hunar.com',
    });
  }

  // 3. Pathname must match /events/<id> where <id> is digits only
  if (!/^\/events\/\d+$/.test(parsed.pathname)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Pathname must match pattern /events/<id>',
    });
  }

  // 4. No credentials
  if (parsed.username || parsed.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'URL must not contain credentials',
    });
  }

  // 5. No query string
  if (parsed.search && parsed.search.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'URL must not contain query parameters',
    });
  }

  // 6. No hash fragment
  if (parsed.hash && parsed.hash.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'URL must not contain a hash fragment',
    });
  }
});

export const programSchema = z.object({
  slug: z.string().min(1),
  code: z.string().min(1).optional(),
  title: z.string().min(2),
  displayCategory: z.string().min(1),
  venueLabel: z.string().min(1),
  mode: z.enum(['Online', 'Offline', 'Hybrid']),
  startsAt: z.string().datetime({ offset: true }),
  isFree: z.boolean(),
  officialUrl: officialEventUrlSchema,
  inquiryCategory: z.enum(['Scholarship', 'Concert', 'Admission', 'General Query']),
});

export type Program = z.infer<typeof programSchema>;

export const RAW_PROGRAMS: Program[] = [
  {
    slug: 'bsef-2026',
    code: 'BSEF',
    title: 'Bihar Science & Engineering Fair (BSEF)-2026',
    displayCategory: 'Science & Technology',
    venueLabel: 'Patna, Bihar',
    mode: 'Offline',
    startsAt: '2026-12-21T08:00:00+05:30',
    isFree: true,
    officialUrl: 'https://k12hunar.com/events/72',
    inquiryCategory: 'General Query',
  },
  {
    slug: 'hrip',
    code: 'HRIP',
    title: 'K12 Hunar Research & Innovation Program (HRIP)',
    displayCategory: 'General',
    venueLabel: 'Online + Optional Offline Workshops',
    mode: 'Hybrid',
    startsAt: '2026-12-15T10:00:00+05:30',
    isFree: true,
    officialUrl: 'https://k12hunar.com/events/111',
    inquiryCategory: 'General Query',
  },
  {
    slug: 'hsip',
    code: 'HSIP',
    title: 'K12 Hunar Startup Internship Program (HSIP)',
    displayCategory: 'General',
    venueLabel: 'Online / Remote',
    mode: 'Online',
    startsAt: '2026-12-01T10:00:00+05:30',
    isFree: true,
    officialUrl: 'https://k12hunar.com/events/107',
    inquiryCategory: 'General Query',
  },
];

/**
 * Format startsAt ISO date as "Tue, 1 Dec 2026 · 10:00 AM IST"
 * Built with Intl.DateTimeFormat formatToParts; uppercase AM/PM; no extra commas.
 */
export function formatProgramDate(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const weekday = partMap.weekday || '';
  const day = partMap.day || '';
  const month = partMap.month || '';
  const year = partMap.year || '';
  const hour = partMap.hour || '';
  const minute = partMap.minute || '';
  const dayPeriod = (partMap.dayPeriod || '').toUpperCase();

  return `${weekday}, ${day} ${month} ${year} · ${hour}:${minute} ${dayPeriod} IST`;
}

/**
 * Returns date components for the solid yellow Date Tile:
 * weekday (tiny uppercase), day (Space Grotesk 700), month (uppercase)
 */
export function getProgramDateTile(isoString: string): { weekday: string; day: string; month: string } {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return { weekday: 'MON', day: '01', month: 'DEC' };

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  return {
    weekday: (partMap.weekday || '').toUpperCase(),
    day: partMap.day || '',
    month: (partMap.month || '').toUpperCase(),
  };
}

/**
 * Plain countdown text: "In 32 days" / "Tomorrow" / "Today"
 */
export function formatCountdownText(isoString: string, now: Date = new Date()): string {
  const days = computeDaysUntil(isoString, now);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

/**
 * Computes remaining days until startsAt relative to now (Asia/Kolkata)
 */
export function computeDaysUntil(isoString: string, now: Date = new Date()): number {
  const target = new Date(isoString).getTime();
  const diffMs = target - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Validates, filters past programs, and sorts by soonest startsAt
 */
export function getActivePrograms(
  programs: Program[] = RAW_PROGRAMS,
  now: Date = new Date()
): Program[] {
  const nowMs = now.getTime();
  const validPrograms: Program[] = [];

  for (const prog of programs) {
    const parseResult = programSchema.safeParse(prog);
    if (!parseResult.success) {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.warn(`[Program Dropped] Invalid program entry "${prog.slug}":`, parseResult.error.format());
      }
      continue;
    }

    const startMs = new Date(prog.startsAt).getTime();
    if (startMs >= nowMs) {
      validPrograms.push(parseResult.data);
    }
  }

  return validPrograms.sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
}

