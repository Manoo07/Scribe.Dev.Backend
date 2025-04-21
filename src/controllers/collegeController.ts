// src/controllers/collegeController.ts
import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_CREATED, HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP_STATUS_NO_CONTENT, HTTP_STATUS_OK } from '@constants/constants';
import { Request, Response } from 'express';
import CollegeService from '../services/collegeService';

export class CollegeController {
  private collegeService = new CollegeService();

  public createCollege = async (req: Request, res: Response): Promise<void> => {
    const { name } = req.body;

    const result = await this.collegeService.createCollege({ name });

    if (result.error) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: result.error });
    } else {
      res.status(HTTP_STATUS_CREATED).json(result.college);
    }
  };

  public getColleges = async (req: Request, res: Response): Promise<void> => {
    try {
      const colleges = await this.collegeService.getColleges();
      res.status(HTTP_STATUS_OK).json(colleges);
    } catch (error) {
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch colleges' });
    }
  };

  public updateCollege = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const updateFields = req.body;

    try {
      const result = await this.collegeService.updateCollege(id, updateFields);

      if (result.error) {
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: result.error });
      } else if (!result.college) {
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'College not found' });
      } else {
        res.status(HTTP_STATUS_OK).json(result.college);
      }
    } catch (error) {
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to update college' });
    }
  };

  public deleteCollege = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id

    try {
      await this.collegeService.deleteCollege(id);
      res.status(HTTP_STATUS_NO_CONTENT).send();
    } catch (error) {
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete college' });
    }
  };
}
