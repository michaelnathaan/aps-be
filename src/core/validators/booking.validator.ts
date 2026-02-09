import { z } from 'zod';
import { ValidationError } from '../../core/errors/custom-errors';

/**
 * Validation schemas using Zod
 * Shared by both REST and GraphQL for consistent validation
 */
const timeSchema = z.string().regex(
  /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
  'Invalid time format. Use HH:MM or HH:MM:SS'
);

export const dateStringSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Invalid date format. Use YYYY-MM-DD'
);

export const createBookingSchema = z.object({
  userId: z.number().int().positive('User ID must be a positive integer'),
  facilityId: z.number().int().positive('Facility ID must be a positive integer'),
  bookingDate: z.coerce.date(),
  startTime: timeSchema,
  endTime: timeSchema
}).refine(
  (data) => data.startTime < data.endTime,
  { message: 'Start time must be before end time', path: ['startTime'] }
);

export const slotAvailabilitySchema = z.object({
  facilityId: z.number().int().positive('Facility ID must be a positive integer'),
  date: z.coerce.date()
});

export const loginSchema = z.object({
  phoneNumber: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be at most 15 digits')
    .regex(/^\+?[0-9]+$/, 'Phone number must contain only digits and optional + prefix')
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fields: Record<string, string> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        fields[path] = err.message;
      });

      throw new ValidationError(
        'Validation failed',
        fields
      );
    }
    throw error;
  }
}