import { PrismaClient, Section } from '@prisma/client';
import { logger } from '@services/logService';
const prisma = new PrismaClient();

const SectionDAO = {
  createSection: async (data: { name: string; yearId: string }): Promise<Section> => {
    try {
      logger.info('[SectionDAO] Creating new section', data);
      const section = await prisma.section.create({ data });
      logger.info('[SectionDAO] Section created successfully', section);
      return section;
    } catch (error) {
      logger.error('[SectionDAO] Error creating section', error);
      throw error;
    }
  },

  getSections: async (): Promise<Section[]> => {
    try {
      logger.info('[SectionDAO] Fetching all sections');
      const sections = await prisma.section.findMany({ include: { year: true } });
      logger.info(`[SectionDAO] Fetched ${sections.length} sections`);
      return sections;
    } catch (error) {
      logger.error('[SectionDAO] Error fetching sections', error);
      throw error;
    }
  },

  getSectionById: async (id: string): Promise<Section | null> => {
    try {
      logger.info(`[SectionDAO] Fetching section with ID: ${id}`);
      return await prisma.section.findUnique({ where: { id }, include: { year: true } });
    } catch (error) {
      logger.error(`[SectionDAO] Error fetching section with ID ${id}`, error);
      throw error;
    }
  },

  updateSection: async (id: string, data: { name?: string; yearId?: string }): Promise<Section> => {
    try {
      logger.info(`[SectionDAO] Updating section id=${id}`, data);
      return await prisma.section.update({ where: { id }, data });
    } catch (error) {
      logger.error(`[SectionDAO] Error updating section with ID ${id}`, error);
      throw error;
    }
  },

  deleteSection: async (id: string): Promise<void> => {
    try {
      logger.info(`[SectionDAO] Deleting section with ID: ${id}`);
      await prisma.section.delete({ where: { id } });
      logger.info('[SectionDAO] Section deleted successfully');
    } catch (error) {
      logger.error(`[SectionDAO] Error deleting section with ID ${id}`, error);
      throw error;
    }
  },
};

export default SectionDAO;
