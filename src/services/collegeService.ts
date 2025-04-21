import { z, ZodError } from 'zod';
import CollegeDAO from '../dao/CollegeDAO';
import { College } from '@prisma/client';
import { logger } from './logService';
import { collegeSchema } from '@utils/validations/college.schema';

interface CollegeDAO {
  createCollege: (data: z.infer<typeof collegeSchema>) => Promise<College>;
}

class CollegeService {
  public async createCollege(params: { name: string }): Promise<{ college?: College; error?: string }> {
    try {
      const validatedData = collegeSchema.parse(params);
      const college = await CollegeDAO.createCollege(validatedData.name);
      return { college };
    } catch (error) {
      if (error instanceof ZodError) {
        return { error: error.errors.map((e) => e.message).join(', ') };
      }
      logger.error('Unexpected error during college creation:', error);
      return { error: 'An unexpected error occurred' }; // Provide a generic error message
    }
  }

  async getColleges(filterOptions: Partial<College> = {}): Promise<College[]> {
    return CollegeDAO.getColleges(filterOptions);
  }

  async updateCollege(id: string, updateFields: Partial<College>): Promise<{ college?: College; error?: string }> {
    try {
      if (updateFields.name) {
        collegeSchema.pick({ name: true }).parse({ name: updateFields.name });
      }
      const college = await CollegeDAO.updateCollege(id, updateFields);

      return { college: college ?? undefined };
    } catch (error) {
      if (error instanceof ZodError) {
        return { error: error.errors.map((e) => e.message).join(', ') };
      }
      throw error;
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
