import { PrismaClient, College } from '@prisma/client';
import { logger } from '../services/logService';

const prisma = new PrismaClient();

const CollegeDAO = {
  createCollege: async (name: string): Promise<College> => {
    logger.info('[CollegeDAO] Creating a new college with name:', name);
    try {
      const college = await prisma.college.create({
        data: {
          name: name,
        },
      });
      logger.info('[CollegeDAO] College created successfully:', college);
      return college;
    } catch (error) {
      logger.error('[CollegeDAO] Error creating college:', error);
      throw error;
    }
  },

  getColleges: async (filterOptions: Partial<College> = {}): Promise<College[]> => {
    logger.info('[CollegeDAO] Fetching colleges with filter:', filterOptions);
    try {
      const colleges = await prisma.college.findMany({ where: filterOptions });
      logger.info(`[CollegeDAO] Fetched ${colleges.length} colleges`);
      return colleges;
    } catch (error) {
      logger.error('[CollegeDAO] Error fetching colleges:', error);
      throw error;
    }
  },

  updateCollege: async (id: string, updateFields: Partial<College>): Promise<College | null> => {
    logger.info(`[CollegeDAO] Updating college with ID=${id} and data:`, updateFields);
    try {
      const updatedCollege = await prisma.college.update({
        where: { id },
        data: updateFields,
      });
      logger.info('[CollegeDAO] College updated successfully:', updatedCollege);
      return updatedCollege;
    } catch (error) {
      logger.error(`[CollegeDAO] Error updating college ID=${id}:`, error);
      throw error;
    }
  },

  deleteCollege: async (id: string): Promise<College | null> => {
    logger.info(`[CollegeDAO] Deleting college with ID=${id}`);
    try {
      const deletedCollege = await prisma.college.delete({ where: { id } });
      logger.info('[CollegeDAO] College deleted successfully:', deletedCollege);
      return deletedCollege;
    } catch (error) {
      logger.error(`[CollegeDAO] Error deleting college ID=${id}:`, error);
      throw error;
    }
  },

  findCollegeById: async (collegeId: string) => {
    logger.info(`[CollegeDAO] Checking existence of college with ID=${collegeId}`);
    try {
      const college = await prisma.college.findUnique({
        where: { id: collegeId },
      });
      logger.info('[CollegeDAO] College found:', college);
      return college;
    } catch (error) {
      logger.error(`[CollegeDAO] Error finding college with ID=${collegeId}:`, error);
      throw error;
    }
  },
};

export default CollegeDAO;
