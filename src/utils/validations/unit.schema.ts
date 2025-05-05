import { z } from 'zod';

export const unitSchema = z.object({
  name: z
    .string()
    .min(2, 'Unit name is required (minimum 2 characters)'),
  classroomId: z
    .string()
    .uuid('Invalid classroom ID format'),
});

export const unitUpdateSchema = unitSchema.partial();
