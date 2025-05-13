import { PrismaClient, Section } from '@prisma/client';
import { logger } from '@services/logService';

const prisma = new PrismaClient();

const SectionDAO = {
  createSection: async (data: { name: string; yearId: string }): Promise<Section> => {
    logger.info('[SectionDAO] Creating new section', data);
    try {
      const section = await prisma.section.create({ data });
      logger.info('[SectionDAO] Section created successfully', section);
      return section;
    } catch (error) {
      logger.error('[SectionDAO] Error creating section:', error);
      throw new Error('Failed to create section');
    }
  },

  getSections: async (): Promise<Section[]> => {
    logger.info('[SectionDAO] Fetching all sections');
    try {
      const sections = await prisma.section.findMany({ include: { year: true } });
      logger.info(`[SectionDAO] Fetched ${sections.length} sections`);
      return sections;
    } catch (error) {
      logger.error('[SectionDAO] Error fetching sections:', error);
      throw new Error('Failed to fetch sections');
    }
  },

  getSectionById: async (id: string): Promise<Section | null> => {
    logger.info(`[SectionDAO] Fetching section ID ${id}`);
    try {
      const section = await prisma.section.findUnique({ where: { id }, include: { year: true } });
      if (!section) {
        logger.warn(`[SectionDAO] Section not found with ID ${id}`);
        return null;
      }
      logger.info('[SectionDAO] Section found:', section);
      return section;
    } catch (error) {
      logger.error(`[SectionDAO] Error fetching section ID ${id}:`, error);
      throw new Error('Failed to fetch section by ID');
    }
  },

  updateSection: async (id: string, data: { name?: string; yearId?: string }): Promise<Section | null> => {
    logger.info(`[SectionDAO] Updating section ID ${id}`, data);
    try {
      const section = await prisma.section.update({ where: { id }, data });
      logger.info('[SectionDAO] Section updated successfully:', section);
      return section;
    } catch (error) {
      logger.error(`[SectionDAO] Error updating section ID ${id}:`, error);
      throw new Error('Failed to update section');
    }
  },

  deleteSection: async (id: string): Promise<void> => {
    logger.info(`[SectionDAO] Deleting section ID ${id}`);
    try {
      await prisma.section.delete({ where: { id } });
      logger.info('[SectionDAO] Section deleted successfully');
    } catch (error) {
      logger.error(`[SectionDAO] Error deleting section ID ${id}:`, error);
      throw new Error('Failed to delete section');
    }
  },

  yearExists: async (yearId: string): Promise<boolean> => {
    logger.info(`[SectionDAO] Checking existence of year ID: ${yearId}`);
    try {
      const year = await prisma.year.findUnique({ where: { id: yearId } });
      const exists = !!year;
      logger.info(`[SectionDAO] Year exists: ${exists}`);
      return exists;
    } catch (error) {
      logger.error('[SectionDAO] Error checking year existence:', error);
      throw new Error('Failed to check year existence');
    }
  },
};

export default SectionDAO;
