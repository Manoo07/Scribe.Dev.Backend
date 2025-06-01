import { Prisma } from '@prisma/client';

export const classroomIncludeFields = {
  section: true,
  faculty: {
    include: {
      user: {
        include: {
          userRole: true,
        },
      },
    },
  },
};

export const virtualClassroomIncludeFields = {
  virtualClassroomStudents: {
    include: {
      student: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  },
};

export const defaultInclude: Prisma.VirtualClassroomInclude = {
  faculty: true,
  section: true,
  // units: true,
  // assignments: true,
  classAttendances: true,
  threads: true,
  virtualClassroomStudents: {
    include: {
      student: true,
    },
  },
};

export const virtualClassroomsIncludeFields = {
  section: {
    select: {
      name: true,
    },
  },
  faculty: {
    select: {
      specialization: true,
    },
  },
};
