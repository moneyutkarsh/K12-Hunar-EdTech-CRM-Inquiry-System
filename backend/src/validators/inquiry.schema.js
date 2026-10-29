import { z } from 'zod';

export const USER_TYPES = ['Parent', 'Student', 'School'];
export const CATEGORIES = ['Scholarship', 'Concert', 'Admission', 'General Query'];
export const STATUSES = ['New', 'In Progress', 'Resolved'];

export const createInquirySchema = z
  .object({
    userType: z.enum(USER_TYPES, {
      message: 'User Type must be Parent, Student, or School',
    }),
    category: z.enum(CATEGORIES, {
      message: 'Category must be Scholarship, Concert, Admission, or General Query',
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
      .max(254, 'Email must not exceed 254 characters')
      .email('Please provide a valid email address'),
    phone: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .refine((val) => {
        const digits = val.replace(/\D/g, '');
        return digits.length >= 8 && digits.length <= 15;
      }, 'Phone number must contain between 8 and 15 digits'),
    message: z
      .string({ required_error: 'Message is required' })
      .trim()
      .min(10, 'Message must be at least 10 characters')
      .max(1000, 'Message must not exceed 1000 characters'),
    website: z.string().optional(), // Honeypot field
    honeypot: z.string().optional(), // Honeypot alias
  })
  .strict();

export const updateStatusSchema = z
  .object({
    status: z.enum(STATUSES, {
      message: 'Status must be New, In Progress, or Resolved',
    }),
  })
  .strict();

export const createNoteSchema = z
  .object({
    note: z
      .string({ required_error: 'Note text is required' })
      .trim()
      .min(1, 'Note cannot be empty')
      .max(1000, 'Note cannot exceed 1000 characters'),
  })
  .strict();

export const uuidParamSchema = z
  .object({
    id: z.string().uuid('Invalid inquiry UUID format'),
  })
  .strict();

export default {
  createInquirySchema,
  updateStatusSchema,
  createNoteSchema,
  uuidParamSchema,
};
