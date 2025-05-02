import { VirtualClassroomParams } from '@controllers/virtualClassroomController';
import { Prisma, PrismaClient, VirtualClassroom } from '@prisma/client';
import { logger } from '@services/logService';
import VirtualClassroomStudentDAO from './virtualClassroomStudentDAO';

const prisma = new PrismaClient();

export const VirtualClassroomDAO = {
  // add the loggers for the below functions
  create: async (data: VirtualClassroomParams) => {
    logger.info('[VirtualClassroomDAO] :Creating virtual classroom with data:', data);
    try {
      const virtualClassroom = await prisma.virtualClassroom.create({
        data: {
          name: data.name,
          facultyId: data.facultyId,
          syllabusUrl: data.syllabusUrl,
          sectionId: data.sectionId,
        },
      });
      return virtualClassroom;
    } catch (error) {
      logger.error('Error creating virtual classroom:', error);
      throw error;
    }
  },

  get: async (filter: Prisma.VirtualClassroomWhereInput) => {
    try {
      const virtualClassroom = await prisma.virtualClassroom.findFirst({
        where: filter,
      });
      return virtualClassroom;
    } catch (error) {
      logger.error('Error fetching virtual classroom:', error);
      throw error;
    }
  },
  getAll: async (filter: Prisma.VirtualClassroomWhereInput) => {
    try {
      const virtualClassrooms = await prisma.virtualClassroom.findMany({
        where: filter,
        include: {
          section: true,
          faculty: true,
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
        },
      });
      return virtualClassrooms;
    } catch (error) {
      logger.error('Error fetching virtual classrooms:', error);
      throw error;
    }
  },
  update: async (id: string, data: Prisma.VirtualClassroomUpdateInput) => {
    try {
      const virtualClassroom = await prisma.virtualClassroom.update({
        where: { id },
        data,
      });
      return virtualClassroom;
    } catch (error) {
      logger.error('Error updating virtual classroom:', error);
      throw error;
    }
  },
  delete: async (id: string) => {
    try {
      const virtualClassroom = await prisma.virtualClassroom.delete({
        where: { id },
      });
      return virtualClassroom;
    } catch (error) {
      logger.error('Error deleting virtual classroom:', error);
      throw error;
    }
  },
  join: async (classroomId: string, studentId: string) => {
    try {
      const classroomStudent = await VirtualClassroomStudentDAO.create({
        studentId,
        classroomId,
      });
      logger.info('[VirtualClassroomDAO] : Student joined virtual classroom:', classroomId, classroomStudent.id);
      return;
    } catch (error) {
      logger.error('[VirtualClassroomService] : Error joining virtual classroom:', error);
      throw error;
    }
  },
};
