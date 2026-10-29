import { z } from 'zod';

export const USER_TYPES = ['Parent', 'Student', 'School'];
export const CATEGORIES = ['Scholarship', 'Concert', 'Admission', 'General Query'];
export const STATUSES = ['New', 'In Progress', 'Resolved'];

export const createInquirySchema = z.object({
  userType: z.enum(USER_TYPES, {
    errorMap: () => ({ message: 'User Type must be Parent, Student, or School' }),
  }),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: 'Category must be Scholarship, Concert, Admission, or General Query' }),
  }),
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    }, 'Phone number must contain between 7 and 15 digits'),
  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must not exceed 1000 characters'),
  honeypot: z.string().optional().refine((val) => !val || val.length === 0, {
    message: 'Bot submission detected',
  }),
});

export const updateStatusSchema = z.object({
  status: z.enum(STATUSES, {
    errorMap: () => ({ message: 'Status must be New, In Progress, or Resolved' }),
  }),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid inquiry UUID format'),
});

export const inquiryQuerySchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  userType: z.enum(USER_TYPES).optional(),
  status: z.enum(STATUSES).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort: z.enum(['created_at', 'name', 'category', 'user_type', 'status']).default('created_at'),
  order: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc'),
});
