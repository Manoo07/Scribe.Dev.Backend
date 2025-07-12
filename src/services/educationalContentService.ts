import EducationalContentDAO from '@dao/educationalContentDAO';
import { logger } from './logService';
import { ContentType } from '@prisma/client';

class EducationalContentService {
  async create(unitId: string, data: { content: string; type: string }) {
    logger.info(
      `[EducationalContentService] Creating content for unitId: ${unitId} with data: ${JSON.stringify(data)}`,
    );
    try {
      const createdContent = await EducationalContentDAO.create(unitId, data);
      logger.info(`[EducationalContentService] Successfully created content with ID: ${createdContent.id}`);
      return createdContent;
    } catch (error) {
      logger.error(`[EducationalContentService] Error creating content for unitId: ${unitId}`, error);
      throw error;
    }
  }

  async get(unitId: string) {
    logger.info(`[EducationalContentService] Fetching content for unitId: ${unitId}`);
    try {
      const contents = await EducationalContentDAO.get(unitId);
      logger.info(`[EducationalContentService] Retrieved ${contents.length} content item(s) for unitId: ${unitId}`);
      return contents;
    } catch (error) {
      logger.error(`[EducationalContentService] Error fetching content for unitId: ${unitId}`, error);
      throw error;
    }
  }

  async getAll(filters: Record<string, any> = {}) {
    logger.info('[EducationalContentService] Fetching all educational contents with filters');
    try {
      const contents = await EducationalContentDAO.getAll(filters);
      logger.info(`[EducationalContentService] Retrieved ${contents.length} content item(s)`);
      return contents;
    } catch (error) {
      logger.error('[EducationalContentService] Error fetching all educational contents', error);
      throw error;
    }
  }

  async update(
    educationalContentId: string,
    updateData: {
      type?: ContentType;
      content?: string;
    },
  ) {
    logger.info(
      `[EducationalContentService] Updating content with ID: ${educationalContentId} using data: ${JSON.stringify(updateData)}`,
    );
    try {
      const updatedContent = await EducationalContentDAO.update(educationalContentId, updateData);
      logger.info(`[EducationalContentService] Successfully updated content with ID: ${educationalContentId}`);
      return updatedContent;
    } catch (error) {
      logger.error(`[EducationalContentService] Error updating content with ID: ${educationalContentId}`, error);
      throw error;
    }
  }

  async delete(educationalContentId: string) {
    logger.info(`[EducationalContentService] Deleting content with ID: ${educationalContentId}`);
    try {
      const deletedContent = await EducationalContentDAO.delete(educationalContentId);
      logger.info(`[EducationalContentService] Successfully deleted content with ID: ${educationalContentId}`);
      return deletedContent;
    } catch (error) {
      logger.error(`[EducationalContentService] Error deleting content with ID: ${educationalContentId}`, error);
      throw error;
    }
  }
}

export default new EducationalContentService();
