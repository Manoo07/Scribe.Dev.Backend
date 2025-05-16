import { Prisma, PrismaClient, VirtualClassroom } from '@prisma/client';
import { logger } from '@services/logService';
import { defaultInclude } from '@utils/prismaIncludes';
import { VirtualClassroomParams } from 'types/express';
import VirtualClassroomStudentDAO from './virtualClassroomStudentDAO';

const prisma = new PrismaClient();

export const VirtualClassroomDAO = {
  create: async (data: VirtualClassroomParams) => {
    logger.info('[VirtualClassroomDAO] Creating virtual classroom:', data);
    try {
      const virtualClassroom = await prisma.virtualClassroom.create({
        data: {
          name: data.name,
          facultyId: data.facultyId,
          syllabusUrl: data.syllabusUrl,
          sectionId: data.sectionId,
        },
      });
      logger.info('[VirtualClassroomDAO] Virtual classroom created:', virtualClassroom.id);
      return virtualClassroom;
    } catch (error) {
      logger.error('[VirtualClassroomDAO] Error creating virtual classroom:', error);
      throw error;
    }
  },

  get: async (
    filter: Prisma.VirtualClassroomWhereInput = {},
    include: Prisma.VirtualClassroomInclude = defaultInclude
  ) => {
    try {
      logger.info(`[VirtualClassroomDAO] Fetching single virtual classroom with filter: ${JSON.stringify(filter)}` );
      logger.info(`[VirtualClassroomDAO] Fetching single virtual classroom with include: ${JSON.stringify(include)}`);

      const virtualClassroom = await prisma.virtualClassroom.findFirst({
        where: filter,
        include,
      });

      if (!virtualClassroom) {
        logger.warn('[VirtualClassroomDAO] No virtual classroom found for filter:', JSON.stringify(filter));
        throw new Error('Virtual classroom does not exist');
      }

      logger.info('[VirtualClassroomDAO] Virtual classroom fetched:', virtualClassroom.id);
      return virtualClassroom;
    } catch (error) {
      logger.error('[VirtualClassroomDAO] Error fetching virtual classroom:', error);
      throw error;
    }
  },

  getAll: async ({
    filter = {},
    include,
    select,
  }: {
    filter?: Prisma.VirtualClassroomWhereInput;
    include?: Prisma.VirtualClassroomInclude;
    select?: Prisma.VirtualClassroomSelect;
  }) => {
    logger.info('[VirtualClassroomDAO] Fetching all virtual classrooms with filter:', filter);
    try {
      const query: Prisma.VirtualClassroomFindManyArgs = {
        where: filter,
      };

      if (include) query.include = include;
      if (select) query.select = select;

      const virtualClassrooms = await prisma.virtualClassroom.findMany(query);
      logger.info(`[VirtualClassroomDAO] Fetched ${virtualClassrooms.length} classrooms`);
      return virtualClassrooms ?? [];
    } catch (error) {
      logger.error('[VirtualClassroomDAO] Error fetching virtual classrooms:', error);
      throw error;
    }
  },

  update: async (id: string, data: Prisma.VirtualClassroomUpdateInput) => {
    logger.info(`[VirtualClassroomDAO] Updating virtual classroom: ${id}`);
    try {
      const virtualClassroom = await prisma.virtualClassroom.update({
        where: { id },
        data,
      });
      logger.info('[VirtualClassroomDAO] Virtual classroom updated:', id);
      return virtualClassroom;
    } catch (error) {
      logger.error('[VirtualClassroomDAO] Error updating virtual classroom:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    logger.info(`[VirtualClassroomDAO] Deleting virtual classroom: ${id}`);
    try {
      const virtualClassroom = await prisma.virtualClassroom.delete({
        where: { id },
      });
      logger.info('[VirtualClassroomDAO] Virtual classroom deleted:', id);
      return virtualClassroom;
    } catch (error) {
      logger.error('[VirtualClassroomDAO] Error deleting virtual classroom:', error);
      throw error;
    }
  },

  join: async (classroomId: string, studentId: string) => {
    logger.info(`[VirtualClassroomDAO] Adding student ${studentId} to classroom ${classroomId}`);
    try {
      const classroomStudent = await VirtualClassroomStudentDAO.create({
        studentId,
        classroomId,
      });
      logger.info('[VirtualClassroomDAO] Student joined virtual classroom:', classroomStudent.id);
      return;
    } catch (error) {
      logger.error('[VirtualClassroomDAO] Error joining virtual classroom:', error);
      throw error;
    }
  },
};
