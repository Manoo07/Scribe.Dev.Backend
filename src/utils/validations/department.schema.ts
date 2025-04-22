import { z } from 'zod';

export const departmentSchema = z.object({
  name: z.string().min(2, 'Department name is required(minimum 2 characters)'),
  collegeId: z.string().uuid('Invalid college ID format'),
});
