import { z } from 'zod';

export const yearSchema = z.object({
  name: z.string().min(1, 'Year name is required'),
  departmentId: z.string().uuid('Invalid department ID'),
});
