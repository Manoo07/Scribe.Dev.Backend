import {
  HTTP_STATUS_BAD_REQUEST,
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
  async create(req: Request, res: Response): Promise<void> {
    const { unitId } = req.params;
    const { content, type } = req.body;

    logger.info(`[EducationalContentController] Creating content for unitId: ${unitId} with data: ${JSON.stringify({ content, type })}`);
    const validTypes = ['NOTE', 'LINK', 'VIDEO', 'DOCUMENT'];
    if (!content || typeof content !== 'string' || content.trim() === '') {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Content must be a non-empty string' });
      return;
    }
    if (!validTypes.includes(type)) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: `Type must be one of: ${validTypes.join(', ')}` });
      return;
    }

    try {
      const unit = await unitDAO.get(unitId);

      if (!unit) {
        logger.warn(`[EducationalContentController] No unit found with ID: ${unitId}`);
        res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Unit not found' });
        return;
      }
      const result = await educationalContentService.create(unitId, { content, type });
      logger.info(`[EducationalContentController] Successfully created content with ID: ${result.id}`);
      res.status(HTTP_STATUS_CREATED).json(result);
    } catch (error) {
      logger.error('[EducationalContentController] Error creating content:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to create educational content' });
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    const { unitId } = req.params;

    logger.info(`[EducationalContentController] Fetching contents for unitId: ${unitId}`);
    try {
      const educationalContents = await educationalContentService.get(unitId);
      logger.info(`[EducationalContentController] Retrieved ${educationalContents.length} content item(s) for unitId: ${unitId}`);
      res.status(HTTP_STATUS_OK).json(educationalContents);
    } catch (error) {
      logger.error('[EducationalContentController] Error fetching contents:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch educational content' });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    logger.info('[EducationalContentController] Fetching all educational contents with filters');
    try {
      const filters = req.body.filter || {};
      const educationalContents = await educationalContentService.getAll(filters);
      logger.info(`[EducationalContentController] Retrieved ${educationalContents.length} content item(s)`);
      res.status(HTTP_STATUS_OK).json(educationalContents);
    } catch (error) {
      logger.error('[EducationalContentController] Error fetching all educational contents:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch educational contents' });
    }
  }


  async update(req: Request, res: Response): Promise<void> {
    const { educationalContentId } = req.params;
    const updateEducationalContent = req.body;

    logger.info(`[EducationalContentController] Updating content with ID: ${educationalContentId} using data: ${JSON.stringify(updateEducationalContent)}`);
    try {
      const updatedContent = await educationalContentService.update(educationalContentId, updateEducationalContent);
      logger.info(`[EducationalContentController] Successfully updated content with ID: ${updatedContent.id}`);
      res.status(HTTP_STATUS_OK).json(updatedContent);
    } catch (error) {
      logger.error('[EducationalContentController] Error updating content:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to update educational content' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { educationalContentId } = req.params;

    logger.info(`[EducationalContentController] Deleting content with ID: ${educationalContentId}`);
    try {
      await educationalContentService.delete(educationalContentId);
      logger.info(`[EducationalContentController] Successfully deleted content with ID: ${educationalContentId}`);
      res.status(HTTP_STATUS_NO_CONTENT).send();
    } catch (error) {
      logger.error('[EducationalContentController] Error deleting content:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete educational content' });
    }
  }
}