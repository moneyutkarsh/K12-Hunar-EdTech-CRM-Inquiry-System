import { z } from 'zod';

export const inquiryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  category: z.string().trim().optional(),
  userType: z.string().trim().optional(),
  status: z.string().trim().optional(),
  search: z.string().trim().min(2, 'Search query must be at least 2 characters').max(60).optional(),
  from: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  to: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  sort: z.enum(['createdAt', 'name', 'status', 'category', 'userType']).default('createdAt'),
  order: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc'),
});

export default { inquiryQuerySchema };
