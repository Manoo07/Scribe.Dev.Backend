import { Request, Response } from 'express';
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from '@constants/constants';
import { logger } from '@services/logService';
import YearService from '@services/yearService';
import { yearSchema } from '@utils/validations/year.schema';

const yearService = new YearService();

export class YearController {
  public async createYear(req: Request, res: Response): Promise<void> {
    const { name, departmentId } = req.body;
    logger.info('[YearController] Creating year');

    try {
      yearSchema.parse({ name, departmentId });
      const result = await yearService.createYear({ name, departmentId });

      if (result.error) {
        logger.error('[YearController] Error creating year:', result.error);
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: result.error });
      }
      res.status(HTTP_STATUS_CREATED).json(result.year);
    } catch (error) {
      logger.error('[YearController] Validation or internal error:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to create year' });
    }
  }

  public async getYears(req: Request, res: Response): Promise<void> {
    try {
      logger.info('[YearController] Fetching all years');
      const years = await yearService.getYears();
      res.status(HTTP_STATUS_OK).json(years);
    } catch (error) {
      logger.error('[YearController] Error fetching years:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch years' });
    }
  }

  public async getYearById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      logger.info(`[YearController] Fetching year with ID=${id}`);
      const year = await yearService.getYearById(id);

      if (!year) {
        res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Year not found' });
      }
      res.status(HTTP_STATUS_OK).json(year);
    } catch (error) {
      logger.error(`[YearController] Error fetching year with ID=${id}:`, error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch year' });
    }
  }

  public async updateYear(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { name, departmentId } = req.body;

    try {
      logger.info(`[YearController] Updating year ID=${id}`);
      const result = await yearService.updateYear(id, { name, departmentId });

      if (result.error) {
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: result.error });
      }
      res.status(HTTP_STATUS_OK).json(result.year);
    } catch (error) {
      logger.error(`[YearController] Error updating year ID=${id}:`, error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to update year' });
    }
  }
  public async deleteYear(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      logger.info(`[YearController] Deleting year ID=${id}`);
      await yearService.deleteYear(id);
      res.status(HTTP_STATUS_OK).json({ message: 'Year deleted successfully' });
    } catch (error) {
      logger.error(`[YearController] Error deleting year ID=${id}:`, error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete year' });
    }
  }
}
