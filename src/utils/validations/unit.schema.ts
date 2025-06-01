import { z } from 'zod';

export const unitSchema = z.object({

  name: z
    .string()
    .min(2, 'Unit name is required (minimum 2 characters)'),
  description: z.string().optional(),

  classroomId: z
    .string()
    .uuid('Invalid classroom ID format'),
});

export const updateUnitSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  educationalContents: z.array(
    z.object({
      id: z.string().optional(),
      type: z.enum(['video', 'document', 'quiz']),
      content: z.string().url(),
      version: z.string().optional(),
    })
  ).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});
// export const unitUpdateSchema = unitSchema.partial();
