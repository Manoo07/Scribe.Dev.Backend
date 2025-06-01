import { Prisma } from '@prisma/client';
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

type StudentWithUser = {
  id: string;
  userId: string;
  enrollmentNo: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

type EnrolledStudents = Prisma.VirtualClassroomGetPayload<{
  include: {
    virtualClassroomStudents: {
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true;
                firstName: true;
                lastName: true;
                email: true;
              };
            };
          };
        };
      };
    };
  };
}>;

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type Student = {
  id: string;
  enrollmentNo: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
};

export interface VirtualClassroomParams {
  name: string;
  facultyId: string;
  sectionId?: string;
  syllabusUrl?: string;
  departmentId?:string;
  yearId:string
}

export type GetStudentsByFilterParams = {
  filter?: Prisma.StudentWhereInput;
  select?: Prisma.StudentSelect;
  include?: Prisma.StudentInclude;
};

export type GetVirtualClassroomStudentsParams = {
  filter?: Prisma.VirtualClassroomStudentWhereInput;
  select?: Prisma.VirtualClassroomStudentSelect;
  include?: Prisma.VirtualClassroomStudentInclude;
};

export interface VirtualClassroomStudentParams {
  studentId: string;
  classroomId: string;
}

export interface ErrorResponse {
  error: string;
  status: number;
}

type SignupResult = any | ErrorResponse;
