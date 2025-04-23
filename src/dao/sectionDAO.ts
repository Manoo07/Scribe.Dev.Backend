import { PrismaClient, Section } from '@prisma/client';
import { logger } from '@services/logService';

const prisma = new PrismaClient();

const SectionDAO = {
  createSection: async (data: { name: string; yearId: string }): Promise<Section> => {
    logger.info('[SectionDAO] Creating new section', data);
    return await prisma.section.create({ data });
  },

  getSections: async (): Promise<Section[]> => {
    logger.info('[SectionDAO] Fetching all sections');
    return await prisma.section.findMany({ include: { year: true } });
  },

  getSectionById: async (id: string): Promise<Section | null> => {
    logger.info(`[SectionDAO] Fetching section ID ${id}`);
    return await prisma.section.findUnique({ where: { id }, include: { year: true } });
  },

  updateSection: async (id: string, data: { name?: string; yearId?: string }): Promise<Section | null> => {
    logger.info(`[SectionDAO] Updating section ID ${id}`, data);
    return await prisma.section.update({ where: { id }, data });
  },

  deleteSection: async (id: string): Promise<void> => {
    logger.info(`[SectionDAO] Deleting section ID ${id}`);
    await prisma.section.delete({ where: { id } });
  },

  yearExists: async (yearId: string): Promise<boolean> => {
    logger.info(`[SectionDAO] Checking existence of year ID: ${yearId}`);
    const year = await prisma.year.findUnique({ where: { id: yearId } });
    return !!year;
  },
};

export default SectionDAO;
