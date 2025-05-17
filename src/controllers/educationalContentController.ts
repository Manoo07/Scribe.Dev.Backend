import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NO_CONTENT,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from '@constants/constants';
import unitDAO from '@dao/unitDAO';
import educationalContentService from '@services/educationalContentService';
import { logger } from '@services/logService';
import unitService from '@services/unitService';
import { Request, Response } from 'express';

export class EducationalContentController {
  async createEducationalContent(req: Request, res: Response): Promise<void> {
    const { unitId } = req.params;
    const { content, type } = req.body;

    logger.info(`[EducationalContentController] Creating content for unitId: ${unitId} with data: ${JSON.stringify({ content, type })}`);
    try {
      const unitExists = await unitDAO.getUnitByUnitId(unitId);
      if (!unitExists) {
        logger.warn(`[EducationalContentController] No unit found with ID: ${unitId}`);
        res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Unit not found' });
        return;
      }
      const result = await educationalContentService.createEducationalContent(unitId, { content, type });
      logger.info(`[EducationalContentController] Successfully created content with ID: ${result.id}`);
      res.status(HTTP_STATUS_CREATED).json(result);
    } catch (error) {
      logger.error('[EducationalContentController] Error creating content:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to create educational content' });
    }
  }

  async getEducationalContentByUnitId(req: Request, res: Response): Promise<void> {
    const { unitId } = req.params;

    logger.info(`[EducationalContentController] Fetching contents for unitId: ${unitId}`);
    try {
      const contents = await educationalContentService.getEducationalContentByUnitId(unitId);
      logger.info(`[EducationalContentController] Retrieved ${contents.length} content item(s) for unitId: ${unitId}`);
      res.status(HTTP_STATUS_OK).json({
        message: `Retrieved ${contents.length} educational content item(s) for unitId: ${unitId}`,
        data: contents
      });
    } catch (error) {
      logger.error('[EducationalContentController] Error fetching contents:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch educational content' });
    }
  }

  async updateEducationalContent(req: Request, res: Response): Promise<void> {
    const { educationalContentId } = req.params;
    const updateEducationalContent = req.body;

    logger.info(`[EducationalContentController] Updating content with ID: ${educationalContentId} using data: ${JSON.stringify(updateEducationalContent)}`);
    try {
      const updatedContent = await educationalContentService.updateEducationalContent(educationalContentId, updateEducationalContent);
      logger.info(`[EducationalContentController] Successfully updated content with ID: ${updatedContent.id}`);
      res.status(HTTP_STATUS_OK).json(updatedContent);
    } catch (error) {
      logger.error('[EducationalContentController] Error updating content:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to update educational content' });
    }
  }

  async deleteEducationalContent(req: Request, res: Response): Promise<void> {
    const { educationalContentId } = req.params;

    logger.info(`[EducationalContentController] Deleting content with ID: ${educationalContentId}`);
    try {
      await educationalContentService.deleteEducationalContentById(educationalContentId);
      logger.info(`[EducationalContentController] Successfully deleted content with ID: ${educationalContentId}`);
      res.status(HTTP_STATUS_NO_CONTENT).send();
    } catch (error) {
      logger.error('[EducationalContentController] Error deleting content:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete educational content' });
    }
  }
}