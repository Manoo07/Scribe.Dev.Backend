import { Year } from '@prisma/client';
import { logger } from './logService';
import { PrismaClient } from '@prisma/client';
import YearDAO from '@dao/yearDAO';

const prisma = new PrismaClient();

class YearService {
  async createYear(data: { name: string; departmentId: string }): Promise<{ year?: Year; error?: string }> {
    try {
      const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!department) {
        logger.warn('[YearService] Invalid department ID');
        return { error: 'Invalid departmentId: No such department exists.' };
      }

      const year = await YearDAO.createYear(data);
      return { year };
    } catch (error) {
      logger.error('[YearService] Error creating year:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  async getYears(departmentId:string): Promise<Year[]> {
    logger.info('[YearService] Fetching all years');
    return YearDAO.getYearsByDepartmentId(departmentId);
  }

  async getYearById(id: string): Promise<Year | null> {
    logger.info(`[YearService] Fetching year ID=${id}`);
    return YearDAO.getYearById(id);
  }

  async updateYear(
    id: string,
    data: { name?: string; departmentId?: string }
  ): Promise<{ year?: Year; error?: string }> {
    try {
      const yearExists = await YearDAO.getYearById(id);
      if (!yearExists) {
        return { error: 'Year not found' };
      }

      const updatedYear = await YearDAO.updateYear(id, data);
      return { year: updatedYear };
    } catch (error) {
      logger.error(`[YearService] Error updating year ID=${id}:`, error);
      return { error: 'Failed to update year' };
    }
  }

  async deleteYear(id: string): Promise<void> {
    try {
      await YearDAO.deleteYear(id);
    } catch (error) {
      logger.error(`[YearService] Error deleting year ID=${id}:`, error);
      throw error;
    }
  }
}

export default YearService;
