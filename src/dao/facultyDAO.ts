import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from '@services/logService';

const prisma = new PrismaClient();

const FacultyDAO = {
  getAllFaculties: async () => {
    logger.info('[FacultyDAO] Fetching all faculties');
    try {
      const faculties = await prisma.faculty.findMany();
      logger.info(`[FacultyDAO] Retrieved ${faculties.length} faculties`);
      return faculties;
    } catch (error) {
      logger.error('[FacultyDAO] Error fetching all faculties:', error);
      throw error;
    }
  },
  // use filters for this
  getFacultyByUserId: async (userId: string) => {
    logger.info('[FacultyDAO] Fetching faculty by user ID:', userId);
    try {
      const faculty = await prisma.faculty.findUnique({
        where: { userId },
        select: {
          id: true,
        },
      });
      if (!faculty) {
        logger.error('[FacultyDAO] Faculty not found for user ID:', userId);
        throw new Error('Faculty not found');
      }
      logger.info('[FacultyDAO] Faculty found:', faculty);
      return faculty;
    } catch (error) {
      logger.error('[FacultyDAO] Error fetching faculty by user ID:', error);
      throw error;
    }
  },

  getFacultiesByFilter: async (filter: Prisma.FacultyWhereInput) => {
    logger.info('[FacultyDAO] Fetching faculties with filter:', filter);
    try {
      const faculties = await prisma.faculty.findMany({
        where: filter,
      });
      logger.info(`[FacultyDAO] Found ${faculties.length} faculties with filter`);
      return faculties;
    } catch (error) {
      logger.error('[FacultyDAO] Error fetching faculties by filter:', error);
      throw error;
    }
  },

  getFacultyById: async (id: string) => {
    logger.info(`[FacultyDAO] Fetching faculty by ID=${id}`);
    try {
      const faculty = await prisma.faculty.findUnique({
        where: { id },
      });
      logger.info('[FacultyDAO] Faculty fetched:', faculty);
      return faculty;
    } catch (error) {
      logger.error(`[FacultyDAO] Error fetching faculty by ID=${id}:`, error);
      throw error;
    }
  },

  createFaculty: async (data: Prisma.FacultyCreateInput) => {
    logger.info('[FacultyDAO] Creating faculty with data:', data);
    try {
      const faculty = await prisma.faculty.create({
        data,
      });
      logger.info('[FacultyDAO] Faculty created successfully:', faculty);
      return faculty;
    } catch (error) {
      logger.error('[FacultyDAO] Error creating faculty:', error);
      throw error;
    }
  },

  updateFaculty: async (id: string, data: Prisma.FacultyUpdateInput) => {
    logger.info(`[FacultyDAO] Updating faculty with ID=${id} and data:`, data);
    try {
      const faculty = await prisma.faculty.update({
        where: { id },
        data,
      });
      logger.info('[FacultyDAO] Faculty updated successfully:', faculty);
      return faculty;
    } catch (error) {
      logger.error(`[FacultyDAO] Error updating faculty with ID=${id}:`, error);
      throw error;
    }
  },
};

export default FacultyDAO;
