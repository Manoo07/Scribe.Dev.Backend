import DepartmentDAO from '@dao/departmentDAO';
import { Department } from '@prisma/client';
import { ZodError } from 'zod';
import { PrismaClient } from '@prisma/client';
import { logger } from './logService';
import { departmentSchema } from '@utils/validations/department.schema';

const prisma = new PrismaClient();

class DepartmentService {
  public async createDepartment(params: {
    name: string;
    collegeId: string;
  }): Promise<{ department?: Department; error?: string }> {
    try {
      logger.info('[DepartmentService] Validating department creation input');
      

      logger.info(`[DepartmentService] Checking if college ID=${params.collegeId} exists`);
      const college = await prisma.college.findUnique({ where: { id: params.collegeId } });

      if (!college) {
        logger.warn(`[DepartmentService] Invalid college ID=${params.collegeId}`);
        return { error: 'Invalid collegeId: No such college exists.' };
      }

      logger.info('[DepartmentService] Creating department via DAO');
      const department = await DepartmentDAO.createDepartment(params);
      return { department };
    } catch (error) {
      logger.error('[DepartmentService] Unexpected error during department creation:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  public async getDepartments(): Promise<Department[]> {
    logger.info('[DepartmentService] Getting all departments');
    return DepartmentDAO.getDepartments();
  }

  public async getDepartmentById(id: string): Promise<Department | null> {
    logger.info(`[DepartmentService] Getting department by ID=${id}`);
    return DepartmentDAO.getDepartmentById(id);
  }

  public async updateDepartment(
    id: string,
    updateFields: { name?: string; collegeId?: string }
  ): Promise<{ department?: Department; error?: string }> {
    try {
      if (updateFields.name) {
        logger.info(`[DepartmentService] Validating update input for department ID=${id}`);
        departmentSchema.pick({ name: true }).parse({ name: updateFields.name });
      }

      logger.info(`[DepartmentService] Updating department ID=${id}`);
      const department = await DepartmentDAO.updateDepartment(id, updateFields);

      return department ? { department } : { error: 'Department not found' };
    } catch (error) {
      logger.error(`[DepartmentService] Unexpected error updating department ID=${id}:`, error);
      return { error: 'Failed to update department' };
    }
  }

  public async deleteDepartment(id: string): Promise<void> {
    try {
      logger.info(`[DepartmentService] Deleting department ID=${id}`);
      await DepartmentDAO.deleteDepartment(id);
    } catch (error) {
      logger.error(`[DepartmentService] Error deleting department ID=${id}:`, error);
      throw new Error('Failed to delete department');
    }
  }
}

export default DepartmentService;
