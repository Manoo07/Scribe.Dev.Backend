import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NO_CONTENT,
  HTTP_STATUS_OK,
  HTTP_STATUS_NOT_FOUND,
} from '@constants/constants';
import DepartmentService from '@services/departmentService';
import { logger } from '@services/logService';
import { Request, Response } from 'express';

export class DepartmentController {
  private departmentService = new DepartmentService();

  public createDepartment = async (req: Request, res: Response): Promise<void> => {
    const { name, collegeId } = req.body;

    logger.info('[DepartmentController] Creating department with name:', name);

    const result = await this.departmentService.createDepartment({ name, collegeId });

    if (result.error) {
      logger.error('[DepartmentController] Error creating department:', result.error);
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: result.error });
    } else {
      logger.info('[DepartmentController] Department created:', result.department);
      res.status(HTTP_STATUS_CREATED).json(result.department);
    }
  };

  public getDepartments = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[DepartmentController] Fetching all departments');
      const departments = await this.departmentService.getDepartments();
      logger.info('[DepartmentController] Fetched all departments');
      res.status(HTTP_STATUS_OK).json(departments);
    } catch (error) {
      logger.error('[DepartmentController] Error fetching departments:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch departments' });
    }
  };

  public getDepartmentById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    logger.info(`[DepartmentController] Fetching department by ID: ${id}`);

    const department = await this.departmentService.getDepartmentById(id);

    if (!department) {
      logger.warn(`[DepartmentController] Department not found for ID: ${id}`);
      res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Department not found' });
    } else {
      logger.info(`[DepartmentController] Department found for ID: ${id}`);
      res.status(HTTP_STATUS_OK).json(department);
    }
  };

  public updateDepartment = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, collegeId } = req.body;

    logger.info(`[DepartmentController] Updating department ID=${id} with name: ${name} and collegeId: ${collegeId}`);

    const result = await this.departmentService.updateDepartment(id, { name, collegeId });

    if (result.error) {
      logger.error(`[DepartmentController] Error updating department ID=${id}:`, result.error);
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: result.error });
    } else {
      logger.info(`[DepartmentController] Department updated ID=${id}:`, result.department);
      res.status(HTTP_STATUS_OK).json(result.department);
    }
  };

  public deleteDepartment = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      logger.info(`[DepartmentController] Deleting department ID=${id}`);
      await this.departmentService.deleteDepartment(id);
      logger.info(`[DepartmentController] Department deleted ID=${id}`);
      res.status(HTTP_STATUS_NO_CONTENT).send();
    } catch (error) {
      logger.error(`[DepartmentController] Error deleting department ID=${id}:`, error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete department' });
    }
  };
}
