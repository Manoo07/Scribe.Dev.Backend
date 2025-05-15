import educationalContentService from '@services/educationalContentService';
import { logger } from '@services/logService';
import { Request, Response } from 'express';


export class EducationalContentController {
    
  async createEducationalContent(req: Request, res: Response): Promise<void> {
    const { unitId } = req.params;
    const { content, type, version } = req.body;

    try {
      const result = await educationalContentService.createEducationalContent(unitId, { content, type, version });
      res.status(201).json(result);
    } catch (error) {
      logger.error('[EducationalContentController] Error creating content:', error);
      res.status(500).json({ error: 'Failed to create educational content' });
    }
  }

  async getEducationalContentByUnitId(req: Request, res: Response): Promise<void> {
    const { unitId } = req.params;

    try {
      const contents = await educationalContentService.getEducationalContentByUnitId(unitId);
      res.status(200).json(contents);
    } catch (error) {
      logger.error('[EducationalContentController] Error fetching contents:', error);
      res.status(500).json({ error: 'Failed to fetch educational content' });
    }
  }

  async updateEducationalContent(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const updateData = req.body;

    try {
      const updated = await educationalContentService.updateEducationalContent(id, updateData);
      res.status(200).json(updated);
    } catch (error) {
      logger.error('[EducationalContentController] Error updating content:', error);
      res.status(500).json({ error: 'Failed to update educational content' });
    }
  }

  async deleteEducationalContent(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      await educationalContentService.deleteEducationalContent(id);
      res.status(204).send();
    } catch (error) {
      logger.error('[EducationalContentController] Error deleting content:', error);
      res.status(500).json({ error: 'Failed to delete educational content' });
    }
  }
}

