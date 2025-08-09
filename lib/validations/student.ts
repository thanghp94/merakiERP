import { z } from 'zod';

// Base student validation schema
export const studentSchema = z.object({
  full_name: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  phone: z.string().min(10, 'Số điện thoại phải có ít nhất 10 chữ số').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'graduated', 'suspended']).default('active'),
  data: z.object({
    date_of_birth: z.string().optional(),
    address: z.string().optional(),
    emergency_contact: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional(),
    }).optional(),
    parent: z.object({
      name: z.string().min(2, 'Tên phụ huynh phải có ít nhất 2 ký tự'),
      phone: z.string().min(10, 'Số điện thoại phụ huynh phải có ít nhất 10 chữ số'),
      email: z.string().email('Email phụ huynh không hợp lệ').optional().or(z.literal('')),
    }),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'ielts', 'toefl']).optional(),
    notes: z.string().optional(),
  }),
});

// Create student schema (for POST requests)
export const createStudentSchema = studentSchema.omit({ status: true });

// Update student schema (for PUT requests)
export const updateStudentSchema = studentSchema.partial();

// Query parameters schema for GET requests
export const studentQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'graduated', 'suspended']).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'ielts', 'toefl']).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
});

// Types derived from schemas
export type Student = z.infer<typeof studentSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentQuery = z.infer<typeof studentQuerySchema>;

// Validation helper functions
export function validateCreateStudent(data: unknown) {
  return createStudentSchema.parse(data);
}

export function validateUpdateStudent(data: unknown) {
  return updateStudentSchema.parse(data);
}

export function validateStudentQuery(query: unknown) {
  return studentQuerySchema.parse(query);
}

// Error messages in Vietnamese and English
export const errorMessages = {
  vi: {
    required: 'Trường này là bắt buộc',
    invalidEmail: 'Email không hợp lệ',
    minLength: (min: number) => `Phải có ít nhất ${min} ký tự`,
    invalidPhone: 'Số điện thoại không hợp lệ',
    invalidStatus: 'Trạng thái không hợp lệ',
    invalidLevel: 'Trình độ không hợp lệ',
  },
  en: {
    required: 'This field is required',
    invalidEmail: 'Invalid email address',
    minLength: (min: number) => `Must be at least ${min} characters`,
    invalidPhone: 'Invalid phone number',
    invalidStatus: 'Invalid status',
    invalidLevel: 'Invalid level',
  }
};
