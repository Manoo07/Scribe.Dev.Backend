import { Section } from '@prisma/client';
import SectionDAO from '@dao/sectionDAO';
import { PrismaClient } from '@prisma/client';
import { logger } from '@services/logService';
import { ZodError } from 'zod';
import { sectionSchema } from '@utils/validations/section.schema';

const prisma = new PrismaClient();

class SectionService {
  async createSection(data: { name: string; yearId: string }): Promise<{ section?: Section; error?: string }> {
    try {
      logger.info('[SectionService] Validating section data before creation', data);
      sectionSchema.parse(data);

      const year = await prisma.year.findUnique({ where: { id: data.yearId } });
      if (!year) {
        logger.error(`[SectionService] Invalid yearId: ${data.yearId}`);
        return { error: 'Invalid yearId: No such year exists.' };
      }

      const section = await SectionDAO.createSection(data);
      logger.info('[SectionService] Section created successfully');
      return { section };
    } catch (error) {
      if (error instanceof ZodError) {
        const validationMessage = error.errors.map((e) => e.message).join(', ');
        logger.warn('[SectionService] Validation error:', validationMessage);
        return { error: validationMessage };
      }

      logger.error('[SectionService] Unexpected error creating section', error);
      return { error: 'Failed to create section' };
    }
  }

  async getSections(): Promise<Section[]> {
    logger.info('[SectionService] Retrieving all sections');
    try {
      return await SectionDAO.getSections();
    } catch (error) {
      logger.error(`[SectionService] Failed to retrieve sections: ${error}`);
      throw new Error('Failed to retrieve sections');
    }
  }

  async getSectionById(id: string): Promise<Section | null> {
    logger.info(`[SectionService] Retrieving section by ID: ${id}`);
    try {
      return await SectionDAO.getSectionById(id);
    } catch (error) {
      logger.error(`[SectionService] Failed to retrieve section with ID ${id}: ${error}`);
      throw new Error(`Failed to retrieve section with ID ${id}`);
    }
  }

  async updateSection(
    id: string,
    updateFields: { name?: string; yearId?: string }
  ): Promise<{ section?: Section; error?: string }> {
    try {
      logger.info(`[SectionService] Validating update fields for section ID: ${id}`, updateFields);
      sectionSchema.partial().parse(updateFields);

      if (updateFields.yearId) {
        const year = await prisma.year.findUnique({ where: { id: updateFields.yearId } });
        if (!year) {
          logger.error(`[SectionService] Invalid yearId: ${updateFields.yearId}`);
          return { error: 'Invalid yearId: No such year exists.' };
        }
      }

      const section = await SectionDAO.updateSection(id, updateFields);
      if (!section) {
        logger.warn(`[SectionService] Section with ID ${id} not found for update`);
        return { error: 'Section not found' };
      }

      logger.info(`[SectionService] Section with ID ${id} updated successfully`);
      return { section };
    } catch (error) {
      if (error instanceof ZodError) {
        const validationMessage = error.errors.map((e) => e.message).join(', ');
        logger.warn('[SectionService] Validation error during update:', validationMessage);
        return { error: validationMessage };
      }

      logger.error(`[SectionService] Error updating section id=${id}`, error);
      return { error: 'Failed to update section' };
    }
  }

  async deleteSection(id: string): Promise<{ error?: string }> {
    try {
      logger.info(`[SectionService] Deleting section with ID: ${id}`);
      await SectionDAO.deleteSection(id);
      logger.info(`[SectionService] Section with ID ${id} deleted successfully`);
      return {};
    } catch (error) {
      logger.error(`[SectionService] Error deleting section with ID ${id}`, error);
      return { error: 'Failed to delete section' };
    }
  }
}

export default SectionService;
