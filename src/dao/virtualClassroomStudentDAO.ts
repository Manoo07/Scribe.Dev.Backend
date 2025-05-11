import { Prisma, PrismaClient, VirtualClassroomStudent } from '@prisma/client';
import { logger } from '@services/logService';

const prisma = new PrismaClient();

export interface VirtualClassroomStudentParams {
  studentId: string;
  classroomId: string;
}

const VirtualClassroomStudentDAO = {
  create: async (data: VirtualClassroomStudentParams, prismaInstance?: Prisma.TransactionClient) => {
    const prismaClient = prismaInstance || prisma;
    try {
      logger.info(`Creating virtual classroom student: ${JSON.stringify(data)}`);
      const virtualClassroomStudentId = await prismaClient.virtualClassroomStudent.create({
        data: {
          student: { connect: { id: data.studentId } },
          classroom: { connect: { id: data.classroomId } },
        },
        select: {
          id: true,
        },
      });
      logger.info('Virtual classroom student created:', virtualClassroomStudentId);
      return virtualClassroomStudentId;
    } catch (error) {
      logger.error('Error creating virtual classroom student:', error);
      throw error;
    }
  },
  get: async (filter: Prisma.VirtualClassroomStudentWhereInput, include?: Prisma.VirtualClassroomStudentInclude) => {
    logger.info('Fetching virtual classroom student with filter:', filter);
    try {
      const virtualClassroomStudent = await prisma.virtualClassroomStudent.findFirst({
        where: filter,
        include: include,
      });
      logger.info('Virtual classroom student fetched:', virtualClassroomStudent);
      return virtualClassroomStudent;
    } catch (error) {
      logger.error('Error fetching virtual classroom student:', error);
      throw error;
    }
  },

  getAll: async ({
    filter = {},
    select,
    include,
  }: {
    filter?: Prisma.VirtualClassroomStudentWhereInput;
    select?: Prisma.VirtualClassroomStudentSelect;
    include?: Prisma.VirtualClassroomStudentInclude;
  }) => {
    try {
      const query: any = {
        where: filter,
      };

      if (select) {
        query.select = select;
      } else if (include) {
        query.include = include;
      }

      const virtualClassroomStudents = await prisma.virtualClassroomStudent.findMany(query);
      return virtualClassroomStudents;
    } catch (error) {
      logger.error('Error fetching virtual classroom students:', error);
      throw error;
    }
  },

  update: async (id: string, data: Prisma.VirtualClassroomStudentUpdateInput) => {
    try {
      const virtualClassroomStudent = await prisma.virtualClassroomStudent.update({
        where: { id },
        data,
      });
      return virtualClassroomStudent;
    } catch (error) {
      logger.error('Error updating virtual classroom student:', error);
      throw error;
    }
  },
  delete: async (id: string) => {
    try {
      logger.info('Deleting virtual classroom student with id:', id);
      const virtualClassroomStudent = await prisma.virtualClassroomStudent.delete({
        where: { id },
      });
      return virtualClassroomStudent;
    } catch (error) {
      logger.error('Error deleting virtual classroom student:', error);
      throw error;
    }
  },
  join: async (virtualClassroomId: string, studentId: string) => {
    try {
      logger.info(
        `[VirtualClassroomDAO] : Joining the classroom with id : ${virtualClassroomId} and student id : ${studentId}`
      );
      const virtualClassroomStudent = await prisma.virtualClassroomStudent.create({
        data: {
          studentId,
          classroomId: virtualClassroomId,
        },
      });
      return virtualClassroomStudent;
    } catch (error) {
      logger.error('Error joining virtual classroom student:', error);
      throw error;
    }
  },
  leave: async (virtualClassroomId: string, studentId: string) => {
    try {
      const virtualClassroomStudent = await prisma.virtualClassroomStudent.delete({
        where: {
          classroomId_studentId: {
            studentId,
            classroomId: virtualClassroomId,
          },
        },
      });
      return virtualClassroomStudent;
    } catch (error) {
      logger.error('Error leaving virtual classroom student:', error);
      throw error;
    }
  },
};

export default VirtualClassroomStudentDAO;
