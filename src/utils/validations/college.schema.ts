import { z, ZodError } from 'zod';

export const collegeSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 1 character' }),
});
