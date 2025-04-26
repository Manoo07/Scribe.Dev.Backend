import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from '@services/logService';

const prisma = new PrismaClient();

const FacultyDAO = {
  getAllFaculties: async () => {
    try {
      const faculties = await prisma.faculty.findMany();
      return faculties;
    } catch (error) {
      console.error('Error fetching all faculties:', error);
      throw error;
    }
  },
  getFacultyByUserId: async (userId: string) => {
    try {
      logger.info('Fetching faculty by user ID:', userId);
      const faculty = await prisma.faculty.findUnique({
        where: { userId },
        select: {
          id: true,
        },
      });
      if (!faculty) {
        logger.error('Faculty not found for user ID:', userId);
        throw new Error('Faculty not found');
      }
      logger.info('Faculty found:', faculty);
      return faculty;
    } catch (error) {
      logger.error('Error fetching faculty by user ID:', error);
      throw error;
    }
  },
  getFacultiesByFilter: async (filter: Prisma.FacultyWhereInput) => {
    try {
      const faculties = await prisma.faculty.findMany({
        where: filter,
      });
      return faculties;
    } catch (error) {
      console.error('Error fetching faculties by filter:', error);
      throw error;
    }
  },
  getFacultyById: async (id: string) => {
    try {
      const faculty = await prisma.faculty.findUnique({
        where: { id },
      });
      return faculty;
    } catch (error) {
      console.error('Error fetching faculty by ID:', error);
      throw error;
    }
  },
  createFaculty: async (data: Prisma.FacultyCreateInput) => {
    try {
      const faculty = await prisma.faculty.create({
        data,
      });
      return faculty;
    } catch (error) {
      console.error('Error creating faculty:', error);
      throw error;
    }
  },
  updateFaculty: async (id: string, data: Prisma.FacultyUpdateInput) => {
    try {
      const faculty = await prisma.faculty.update({
        where: { id },
        data,
      });
      return faculty;
    } catch (error) {
      console.error('Error updating faculty:', error);
      throw error;
    }
  },
};

export default FacultyDAO;
