import { Request, Response } from 'express';
import SectionService from '@services/sectionService';
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_NO_CONTENT,
  HTTP_STATUS_OK,
} from '@constants/constants';
import { logger } from '@services/logService';

export class SectionController {
  private sectionService = new SectionService();

  public createSection = async (req: Request, res: Response): Promise<void> => {
    logger.info('[SectionController] Received request to create section', req.body);
    const result = await this.sectionService.createSection(req.body);

    if (result.error) {
      logger.warn('[SectionController] Failed to create section', result.error);
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: result.error });
    } else {
      logger.info('[SectionController] Section created successfully');
      res.status(HTTP_STATUS_CREATED).json(result.section);
    }
  };

  public getSections = async (_: Request, res: Response): Promise<void> => {
    try {
      logger.info('[SectionController] Fetching all sections');
      const sections = await this.sectionService.getSections();
      res.status(HTTP_STATUS_OK).json(sections);
    } catch (error) {
      logger.error('[SectionController] Failed to fetch sections', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch sections' });
    }
  };

  public getSectionById = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    logger.info(`[SectionController] Fetching section by ID: ${id}`);
    const section = await this.sectionService.getSectionById(id);

    if (!section) {
      logger.warn(`[SectionController] Section not found for ID: ${id}`);
      res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Section not found' });
    } else {
      res.status(HTTP_STATUS_OK).json(section);
    }
  };

  public updateSection = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    logger.info(`[SectionController] Updating section with ID: ${id}`, req.body);
    const result = await this.sectionService.updateSection(id, req.body);

    if (result.error) {
      logger.warn(`[SectionController] Failed to update section ID ${id}`, result.error);
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: result.error });
    } else {
      logger.info(`[SectionController] Section with ID ${id} updated successfully`);
      res.status(HTTP_STATUS_OK).json(result.section);
    }
  };

  public deleteSection = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    logger.info(`[SectionController]Deleting section with ID: ${id}`);
    const result = await this.sectionService.deleteSection(id);

    if (result.error) {
      logger.error(`[SectionController] Failed to delete section ID ${id}`, result.error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: result.error });
    } else {
      logger.info(`[SectionController] Section with ID ${id} deleted successfully`);
      res.status(HTTP_STATUS_NO_CONTENT).send();
    }
  };
}
