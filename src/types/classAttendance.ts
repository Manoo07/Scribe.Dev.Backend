import { z } from 'zod';

export const ClassAttendanceRequestSchema = z.object({
  classroomId: z.string().uuid(),
  students: z.array(z.string().uuid()),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  present: z.boolean(),
});

export type ClassAttendanceRequestDTO = z.infer<typeof ClassAttendanceRequestSchema>;
