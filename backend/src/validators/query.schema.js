import { z } from 'zod';

export const inquiryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  category: z.string().trim().optional(),
  userType: z.string().trim().optional(),
  status: z.string().trim().optional(),
  priority: z.string().trim().optional(),
  assignedTo: z.string().trim().optional(),
  search: z.string().trim().max(100).optional(),
  from: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  to: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  sort: z
    .enum(['createdAt', 'created_at', 'name', 'status', 'category', 'userType', 'user_type', 'priority'])
    .default('createdAt')
    .transform((val) => {
      if (val === 'created_at') return 'createdAt';
      if (val === 'user_type') return 'userType';
      return val;
    }),
  order: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc'),
});

export default { inquiryQuerySchema };
