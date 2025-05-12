import { Prisma, PrismaClient, VirtualClassroomStudent } from '@prisma/client';
import { logger } from '@services/logService';
import { GetVirtualClassroomStudentsParams, VirtualClassroomStudentParams } from 'types/express';

const prisma = new PrismaClient();

const VirtualClassroomStudentDAO = {
  create: async (data: VirtualClassroomStudentParams, prismaInstance?: Prisma.TransactionClient) => {
    const prismaClient = prismaInstance || prisma;
    logger.info('[VirtualClassroomStudentDAO] Creating virtual classroom student with data:', data);
    try {
      const virtualClassroomStudentId = await prismaClient.virtualClassroomStudent.create({
        data: {
          student: { connect: { id: data.studentId } },
          classroom: { connect: { id: data.classroomId } },
        },
        select: {
          id: true,
        },
      });
      logger.info(
        '[VirtualClassroomStudentDAO] Created virtual classroom student with ID:',
        virtualClassroomStudentId.id
      );
      return virtualClassroomStudentId;
    } catch (error) {
      logger.error('[VirtualClassroomStudentDAO] Error creating virtual classroom student:', error);
      throw error;
    }
  },

  get: async (filter: Prisma.VirtualClassroomStudentWhereInput, include?: Prisma.VirtualClassroomStudentInclude) => {
    logger.info('[VirtualClassroomStudentDAO] Fetching virtual classroom student with filter:', filter);
    try {
      const virtualClassroomStudent = await prisma.virtualClassroomStudent.findFirst({
        where: filter,
        include: include,
      });
      logger.info('[VirtualClassroomStudentDAO] Fetched virtual classroom student:', virtualClassroomStudent);
      return virtualClassroomStudent;
    } catch (error) {
      logger.error('[VirtualClassroomStudentDAO] Error fetching virtual classroom student:', error);
      throw error;
    }
  },

  getAll: async ({ filter = {}, select, include }: GetVirtualClassroomStudentsParams) => {
    logger.info('[VirtualClassroomStudentDAO] Fetching all virtual classroom students with filter:', filter);
    try {
      const query: Prisma.VirtualClassroomStudentFindManyArgs = {
        where: filter,
      };

      if (select) {
        query.select = select;
        logger.info('[VirtualClassroomStudentDAO] Using select in query');
      } else if (include) {
        query.include = include;
        logger.info('[VirtualClassroomStudentDAO] Using include in query');
      }

      const virtualClassroomStudents = await prisma.virtualClassroomStudent.findMany(query);
      logger.info(`[VirtualClassroomStudentDAO] Fetched ${virtualClassroomStudents.length} virtual classroom students`);
      return virtualClassroomStudents;
    } catch (error) {
      logger.error('[VirtualClassroomStudentDAO] Error fetching virtual classroom students:', error);
      throw error;
    }
  },

  update: async (id: string, data: Prisma.VirtualClassroomStudentUpdateInput) => {
    logger.info(`[VirtualClassroomStudentDAO] Updating virtual classroom student with ID: ${id}`);
    try {
      const virtualClassroomStudent = await prisma.virtualClassroomStudent.update({
        where: { id },
        data,
      });
      logger.info('[VirtualClassroomStudentDAO] Updated virtual classroom student:', virtualClassroomStudent);
      return virtualClassroomStudent;
    } catch (error) {
      logger.error('[VirtualClassroomStudentDAO] Error updating virtual classroom student:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    logger.info('[VirtualClassroomStudentDAO] Deleting virtual classroom student with ID:', id);
    try {
      const virtualClassroomStudent = await prisma.virtualClassroomStudent.delete({
        where: { id },
      });
      logger.info('[VirtualClassroomStudentDAO] Deleted virtual classroom student:', virtualClassroomStudent);
      return virtualClassroomStudent;
    } catch (error) {
      logger.error('[VirtualClassroomStudentDAO] Error deleting virtual classroom student:', error);
      throw error;
    }
  },

  join: async (virtualClassroomId: string, studentId: string) => {
    logger.info(`[VirtualClassroomStudentDAO] Student ${studentId} joining classroom ${virtualClassroomId}`);
    try {
      const virtualClassroomStudent = await prisma.virtualClassroomStudent.create({
        data: {
          studentId,
          classroomId: virtualClassroomId,
        },
      });
      logger.info('[VirtualClassroomStudentDAO] Student joined classroom:', virtualClassroomStudent);
      return virtualClassroomStudent;
    } catch (error) {
      logger.error('[VirtualClassroomStudentDAO] Error joining virtual classroom:', error);
      throw error;
    }
  },

  leave: async (virtualClassroomId: string, studentId: string) => {
    logger.info(`[VirtualClassroomStudentDAO] Student ${studentId} leaving classroom ${virtualClassroomId}`);
    try {
      const virtualClassroomStudent = await prisma.virtualClassroomStudent.delete({
        where: {
          classroomId_studentId: {
            studentId,
            classroomId: virtualClassroomId,
          },
        },
      });
      logger.info('[VirtualClassroomStudentDAO] Student left classroom:', virtualClassroomStudent);
      return virtualClassroomStudent;
    } catch (error) {
      logger.error('[VirtualClassroomStudentDAO] Error leaving virtual classroom:', error);
      throw error;
    }
  },
};

export default VirtualClassroomStudentDAO;
