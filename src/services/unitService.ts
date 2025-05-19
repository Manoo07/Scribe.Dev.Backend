import { PrismaClient, Unit } from '@prisma/client';
import UnitDAO from '@dao/unitDAO';
import { logger } from '../services/logService';
import { VirtualClassroomDAO } from '@dao/virtualClassroomDAO';

const prisma = new PrismaClient();

class UnitService {

  public async create(params: {
    name: string; description: string; classroomId: string; educationalContents?: { contentType: string; url: string }[];
  }) {
    try {
      logger.info('[UnitService] Creating unit with params:', params);
      const classroom = await VirtualClassroomDAO.get({ id: params.classroomId });
      if (!classroom) {
        logger.warn(`[UnitService] Invalid classroomId: ${params.classroomId}`);
        throw new Error('Invalid classroomId');
      }

      const unit = await UnitDAO.create(params);
      logger.info('[UnitService] Unit created successfully:', unit);
      return unit;
    } catch (error) {
      logger.error('[UnitService] Error creating unit:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  public async get(UnitId: string) {
    try {
      logger.info(`[UnitService] Fetching unit with ID: ${UnitId}`);
      const unit = await UnitDAO.get(UnitId);
      logger.info('[UnitService] Fetched unit successfully');
      return unit;
    } catch (error) {
      logger.error('[UnitService] Error fetching unit:', error);
      throw error;
    }
  }

  public async getAll(filters?: any): Promise<Unit[]> {
    try {
      logger.info(`[UnitService] Fetching unit with filter: ${filters}`);
      const units = await UnitDAO.getAll(filters);
      logger.info(`[UnitService] Units fetched successfully for filter=${filters}`);
      return units;
    } catch (error) {
      logger.error(`[UnitService] Error fetching units for filter=${filters}:`, error);
      throw error;
    }
  }



  public async update(UnitId: string, updateFields: { name: string; description: string }) {
    try {
      logger.info(`[UnitService] Updating unit ID=${UnitId} with fields:`, updateFields);
      const unit = await UnitDAO.update(UnitId, updateFields);
      if (unit) {
        logger.info(`[UnitService] Unit ID=${UnitId} updated successfully`);
        return unit;
      } else {
        logger.warn(`[UnitService] Unit ID=${UnitId} not found for update`);
        throw new Error('Unit not found');
      }
    } catch (error) {
      logger.error(`[UnitService] Error updating unit ID=${UnitId}:`, error);
      return { error: 'Update failed' };
    }
  }

  public async delete(unitId: string) {
    try {
      logger.info(`[UnitService] Deleting unit with ID: ${unitId}`);
      await UnitDAO.delete(unitId);
      logger.info(`[UnitService] Unit ID=${unitId} deleted successfully`);
    } catch (error) {
      logger.error(`[UnitService] Error deleting unit ID=${unitId}:`, error);
      throw error;
    }
  }
}

export default UnitService;
