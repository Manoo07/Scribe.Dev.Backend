import { PrismaClient, Year } from '@prisma/client';
import { logger } from '@services/logService';

const prisma = new PrismaClient();

const YearDAO = {
  async createYear(data: { name: string; departmentId: string }): Promise<Year> {
    logger.info('[YearDAO] Creating year');
    try {
      const year = await prisma.year.create({ data });
      logger.info('[YearDAO] Year created successfully');
      return year;
    } catch (error) {
      logger.error('[YearDAO] Failed to create year:', error);
      throw new Error('Database error: Unable to create year');
    }
  },

  async getYears(): Promise<Year[]> {
    logger.info('[YearDAO] Fetching all years');
    try {
      const years = await prisma.year.findMany({ include: { department: true } });
      logger.info('[YearDAO] Years fetched successfully');
      return years;
    } catch (error) {
      logger.error('[YearDAO] Failed to fetch years:', error);
      throw new Error('Database error: Unable to fetch years');
    }
  },

  async getYearById(id: string): Promise<Year | null> {
    logger.info(`[YearDAO] Fetching year ID=${id}`);
    try {
      const year = await prisma.year.findUnique({ where: { id }, include: { department: true } });
      if (year) {
        logger.info(`[YearDAO] Year found with ID=${id}`);
      } else {
        logger.warn(`[YearDAO] No year found with ID=${id}`);
      }
      return year;
    } catch (error) {
      logger.error(`[YearDAO] Failed to fetch year ID=${id}:`, error);
      throw new Error('Database error: Unable to fetch year');
    }
  },

  async updateYear(id: string, data: Partial<Year>): Promise<Year> {
    logger.info(`[YearDAO] Updating year ID=${id}`);
    try {
      const updatedYear = await prisma.year.update({ where: { id }, data });
      logger.info(`[YearDAO] Year updated successfully ID=${id}`);
      return updatedYear;
    } catch (error) {
      logger.error(`[YearDAO] Failed to update year ID=${id}:`, error);
      throw new Error('Database error: Unable to update year');
    }
  },

  async deleteYear(id: string): Promise<void> {
    logger.info(`[YearDAO] Deleting year ID=${id}`);
    try {
      await prisma.year.delete({ where: { id } });
      logger.info(`[YearDAO] Year deleted successfully ID=${id}`);
    } catch (error) {
      logger.error(`[YearDAO] Failed to delete year ID=${id}:`, error);
      throw new Error('Database error: Unable to delete year');
    }
  },
};

export default YearDAO;
