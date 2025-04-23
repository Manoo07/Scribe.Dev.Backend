import { z, ZodError } from 'zod';
import CollegeDAO from '../dao/CollegeDAO';
import { College } from '@prisma/client';
import { logger } from './logService';
import { collegeSchema } from '@utils/validations/college.schema';

interface CollegeDAO {
  createCollege: (data: z.infer<typeof collegeSchema>) => Promise<College>;
}

class CollegeService {
  public async createCollege(params: { name: string }): Promise<{ college: College }> {
    try {
      const college = await CollegeDAO.createCollege(params.name);
      return { college };
    } catch (error) {
      logger.error('Unexpected error during college creation:', error);
      throw new Error('An unexpected error occurred while creating the college.');
    }
  }

  async getColleges(filterOptions: Partial<College> = {}): Promise<College[]> {
    try {
      return await CollegeDAO.getColleges(filterOptions);
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch colleges');
    }
  }

  async updateCollege(id: string, updateFields: Partial<College>): Promise<{ college?: College; error?: string }> {
    try {
      const college = await CollegeDAO.updateCollege(id, updateFields);
      return { college: college ?? undefined };
    } catch (error) {
      throw new Error('Error while updating college');
    }
  }

  async deleteCollege(id: string): Promise<void> {
    try {
      logger.info('Deleting college with ID:', id);
      await CollegeDAO.deleteCollege(id);
      logger.info('College deleted successfully');
    } catch (error) {
      logger.error(`Error deleting college with ID ${id}:`, error);
      throw new Error('Failed to delete college');
    }
  }
}

export default CollegeService;
