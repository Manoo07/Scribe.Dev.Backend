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
import { departmentSchema } from '@utils/validations/department.schema';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

export class DepartmentController {
  private departmentService = new DepartmentService();

  public createDepartment = async (req: Request, res: Response): Promise<void> => {
    const { name, collegeId } = req.body;
    departmentSchema.parse({ name, collegeId });

    logger.info('[DepartmentController] Creating department with name:', name);

    try {
      const result = await this.departmentService.createDepartment({ name, collegeId });
      logger.info('[DepartmentController] Department created:', result.department);
      res.status(HTTP_STATUS_CREATED).json(result.department);
    } catch (error: any) {
      logger.error('[DepartmentController] Error creating department:', error.message || error);
      if (error instanceof ZodError) {
        logger.warn('[DepartmentService] Validation error during update:', error.errors);
        const errorMessage = error.errors.map((e) => e.message).join(', ');
        res.status(HTTP_STATUS_BAD_REQUEST).json({
          message: errorMessage,
        });
      }
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Something went wrong',
      });
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

    try {
      const department = await this.departmentService.getDepartmentById(id);

      if (!department) {
        logger.warn(`[DepartmentController] Department not found for ID: ${id}`);
        res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Department not found' });
        return;
      }

      logger.info(`[DepartmentController] Department found for ID: ${id}`);
      res.status(HTTP_STATUS_OK).json(department);
    } catch (error: any) {
      logger.error(`[DepartmentController] Error fetching department by ID: ${id}`, error.message || error);

      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        error: error.message || 'An unexpected error occurred',
      });
    }
  };

  public updateDepartment = async (req: Request, res: Response): Promise<void > => {
    const { id } = req.params;
    const updateFields = req.body;

    logger.info(
      `[DepartmentController] Updating department ID=${id} with name: ${updateFields.name} and collegeId: ${updateFields.collegeId}`
    );
    try {
      // validations
      if (updateFields.name) {
        logger.info(`[DepartmentService] Validating update input for department ID=${id}`);
        departmentSchema.pick({ name: true }).parse({ name: updateFields.name });
      }
      const result = await this.departmentService.updateDepartment(id, updateFields);

      if (result.error) {
        logger.error(`[DepartmentController] Error updating department ID=${id}:`, result.error);
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: result.error });
      }
      logger.info(`[DepartmentController] Department updated ID=${id}:`, result.department);
      res.status(HTTP_STATUS_OK).json(result.department);
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('[DepartmentService] Validation error during update:', error.errors);
        const errorMessage = error.errors.map((e) => e.message).join(', ');
        res.status(HTTP_STATUS_BAD_REQUEST).json({
          message: errorMessage,
        });
      }
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Something went wrong',
      });
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
