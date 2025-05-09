import { PrismaClient, College } from '@prisma/client';
import { logger } from '../services/logService';

const prisma = new PrismaClient();

const CollegeDAO = {
  createCollege: async (name: string): Promise<College> => {
    try {
      logger.info('Creating a new college with data:', name);
      const college = await prisma.college.create({
        data: {
          name: name,
        },
      });
      logger.info('College created successfully:', college);
      return college;
    } catch (error) {
      logger.error('Error creating college:', error);
      throw error;
    }
  },

  getColleges: async (filterOptions: Partial<College> = {}): Promise<College[]> => {
    try {
      logger.info('Fetching colleges with filter:', filterOptions);
      const colleges = await prisma.college.findMany({ where: filterOptions });
      logger.info(`Fetched ${colleges.length} colleges`);
      return colleges;
    } catch (error) {
      logger.error('Error fetching colleges:', error);
      throw error;
    }
  },

  updateCollege: async (id: string, updateFields: Partial<College>): Promise<College | null> => {
    try {
      logger.info(`Updating college id=${id} with data:`, updateFields);
      const updatedCollege = await prisma.college.update({
        where: { id },
        data: updateFields,
      });
      logger.info('College updated successfully:', updatedCollege);
      return updatedCollege;
    } catch (error) {
      logger.error(`Error updating college id=${id}:`, error);
      throw error;
    }
  },

  deleteCollege: async (id: string): Promise<College | null> => {
    try {
      logger.info(`Deleting college id=${id}`);
      const deletedCollege = await prisma.college.delete({ where: { id } });
      logger.info('College deleted successfully:', deletedCollege);
      return deletedCollege;
    } catch (error) {
      logger.error(`Error deleting college id=${id}:`, error);
      throw error;
    }
  },
  findCollegeById:async(collegeId: string)=> {
    logger.info(`Checking existence of college ID=${collegeId}`);
    return prisma.college.findUnique({
      where: { id: collegeId },
    });
  },
};

  

export default CollegeDAO;
