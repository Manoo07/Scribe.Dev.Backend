import { PrismaClient, Department, Prisma } from '@prisma/client';
import { logger } from '../services/logService';

const prisma = new PrismaClient();

const DepartmentDAO = {
  createDepartment: async (data: { name: string; collegeId: string }): Promise<Department> => {
    try {
      logger.info('[DepartmentDAO] Creating department:', data);
      const department = await prisma.department.create({ data });
      logger.info('[DepartmentDAO] Department created:', department);
      return department;
    } catch (error) {
      logger.error('[DepartmentDAO] Error creating department:', error);
      throw error;
    }
  },

  getDepartments: async (): Promise<Department[]> => {
    try {
      logger.info('[DepartmentDAO] Fetching all departments');
      const departments = await prisma.department.findMany({ include: { college: true } });
      logger.info(`[DepartmentDAO] Fetched ${departments.length} departments`);
      return departments;
    } catch (error) {
      logger.error('[DepartmentDAO] Error fetching departments:', error);
      throw error;
    }
  },

  getDepartmentById: async (id: string): Promise<Department | null> => {
    try {
      logger.info(`[DepartmentDAO] Fetching department by ID: ${id}`);
      const department = await prisma.department.findUnique({ where: { id }, include: { college: true } });
      return department;
    } catch (error) {
      logger.error(`[DepartmentDAO] Error fetching department ID=${id}:`, error);
      throw error;
    }
  },

  getDepartmentsByFilter: async (filter: Record<string, any> = {}): Promise<Department[]> => {
    try {
      logger.info('[DepartmentDAO] Fetching departments with filter:', filter);
      const departments = await prisma.department.findMany({
        where: filter,
        include: { college: true },
      });
      logger.info(`[DepartmentDAO] Fetched ${departments.length} departments`);
      return departments;
    } catch (error) {
      logger.error('[DepartmentDAO] Error fetching departments:', error);
      throw error;
    }
  },



  updateDepartment: async (id: string, updateFields: Partial<Department>): Promise<Department | null> => {
    try {
      logger.info(`[DepartmentDAO] Updating department ID=${id} with:`, updateFields);
      const updated = await prisma.department.update({ where: { id }, data: updateFields });
      logger.info('[DepartmentDAO] Department updated:', updated);
      return updated;
    } catch (error) {
      logger.error(`[DepartmentDAO] Error updating department ID=${id}:`, error);
      throw error;
    }
  },

  deleteDepartment: async (id: string): Promise<void> => {
    try {
      logger.info(`[DepartmentDAO] Deleting department ID=${id}`);
      await prisma.department.delete({ where: { id } });
      logger.info('[DepartmentDAO] Department deleted successfully');
    } catch (error) {
      logger.error(`[DepartmentDAO] Error deleting department ID=${id}:`, error);
      throw error;
    }
  },
};

export default DepartmentDAO;
