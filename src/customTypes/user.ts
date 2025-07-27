import { Role } from '@prisma/client';

export interface SignupParams {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  collegeId: string;
  role: Role;
  departmentId: string;
  sectionId: string;
  yearId?: string;
  specialization?: string;
}
