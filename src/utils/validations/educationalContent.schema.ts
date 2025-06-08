import { z } from 'zod';

export const educationalContentSchema = z.object({
  type: z.string(),
  content: z.string().optional(),
  version: z.number().min(1).optional(),
});
