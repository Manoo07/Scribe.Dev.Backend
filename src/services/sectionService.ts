import { Section } from '@prisma/client';
import SectionDAO from '@dao/sectionDAO';
import { logger } from '@services/logService';

class SectionService {
  async createSection(data: { name: string; yearId: string }): Promise<{ section?: Section; error?: string }> {
    try {
      const section = await SectionDAO.createSection(data);
      logger.info('[SectionService] Section created successfully');
      return { section };
    } catch (error) {
      logger.error('[SectionService] Unexpected error creating section', error);
      return { error: 'Failed to create section' };
    }
  }

  async getSections(): Promise<Section[]> {
    try {
      return await SectionDAO.getSections();
    } catch (error) {
      logger.error('[SectionService] Failed to retrieve sections', error);
      throw new Error('Failed to retrieve sections');
    }
  }

  async getSectionById(id: string): Promise<Section | null> {
    try {
      return await SectionDAO.getSectionById(id);
    } catch (error) {
      logger.error(`[SectionService] Failed to retrieve section ID ${id}`, error);
      throw new Error(`Failed to retrieve section with ID ${id}`);
    }
  }

  async updateSection(
    id: string,
    updateFields: { name?: string; yearId?: string }
  ): Promise<{ section?: Section; error?: string }> {
    try {
      const section = await SectionDAO.updateSection(id, updateFields);
      if (!section) {
        return { error: 'Section not found' };
      }
      return { section };
    } catch (error) {
      logger.error(`[SectionService] Error updating section ID ${id}`, error);
      return { error: 'Failed to update section' };
    }
  }

  async deleteSection(id: string): Promise<{ error?: string }> {
    try {
      await SectionDAO.deleteSection(id);
      return {};
    } catch (error) {
      logger.error(`[SectionService] Error deleting section ID ${id}`, error);
      return { error: 'Failed to delete section' };
    }
  }
}

export default SectionService;
