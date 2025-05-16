import {
    HTTP_STATUS_CREATED,
    HTTP_STATUS_INTERNAL_SERVER_ERROR,
    HTTP_STATUS_NO_CONTENT,
    HTTP_STATUS_OK,
} from '@constants/constants';
import educationalContentService from '@services/educationalContentService';
import { logger } from '@services/logService';
import { Request, Response } from 'express';

export class EducationalContentController {
    async createEducationalContent(req: Request, res: Response): Promise<void> {
        const { unitId } = req.params;
        const { content, type, version } = req.body;

        logger.info(`[EducationalContentController] Creating content for unitId: ${unitId} with data: ${JSON.stringify({ content, type, version })}`);
        try {
            const result = await educationalContentService.createEducationalContent(unitId, { content, type, version });
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
            res.status(HTTP_STATUS_OK).json(contents);
        } catch (error) {
            logger.error('[EducationalContentController] Error fetching contents:', error);
            res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch educational content' });
        }
    }

    async updateEducationalContent(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const updateData = req.body;

        logger.info(`[EducationalContentController] Updating content with ID: ${id} using data: ${JSON.stringify(updateData)}`);
        try {
            const updated = await educationalContentService.updateEducationalContent(id, updateData);
            logger.info(`[EducationalContentController] Successfully updated content with ID: ${updated.id}`);
            res.status(HTTP_STATUS_OK).json(updated);
        } catch (error) {
            logger.error('[EducationalContentController] Error updating content:', error);
            res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to update educational content' });
        }
    }

    async deleteEducationalContent(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        logger.info(`[EducationalContentController] Deleting content with ID: ${id}`);
        try {
            await educationalContentService.deleteEducationalContent(id);
            logger.info(`[EducationalContentController] Successfully deleted content with ID: ${id}`);
            res.status(HTTP_STATUS_NO_CONTENT).send();
        } catch (error) {
            logger.error('[EducationalContentController] Error deleting content:', error);
            res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete educational content' });
        }
    }
}
