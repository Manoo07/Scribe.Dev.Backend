import { PrismaClient } from '@prisma/client';
import UnitDAO from '@dao/unitDAO';
import { logger } from '../services/logService';

const prisma = new PrismaClient();

class UnitService {
    public async createUnit(params: { name: string; classroomId: string; educationalContents?: any[] }) {
        try {
            logger.info('[UnitService] Creating unit with params:', params);
            const classroom = await prisma.virtualClassroom.findUnique({ where: { id: params.classroomId } });
            if (!classroom) {
                logger.warn(`[UnitService] Invalid classroomId: ${params.classroomId}`);
                return { error: 'Invalid classroomId' };
            }

            const unit = await UnitDAO.createUnit(params);
            logger.info('[UnitService] Unit created successfully:', unit);
            return { unit };
        } catch (error) {
            logger.error('[UnitService] Error creating unit:', error);
            return { error: 'An unexpected error occurred' };
        }
    }

    public async getUnits() {
        try {
            logger.info('[UnitService] Fetching all units');
            const units = await UnitDAO.getUnits();
            logger.info('[UnitService] Fetched units successfully');
            return units;
        } catch (error) {
            logger.error('[UnitService] Error fetching units:', error);
            throw error;
        }
    }

    public async getUnitById(id: string) {
        try {
            logger.info(`[UnitService] Fetching unit with ID: ${id}`);
            const unit = await UnitDAO.getUnitById(id);
            logger.info(`[UnitService] Unit fetched successfully for ID=${id}`);
            return unit;
        } catch (error) {
            logger.error(`[UnitService] Error fetching unit ID=${id}:`, error);
            throw error;
        }
    }

    public async updateUnit(id: string, updateFields: any) {
        try {
            logger.info(`[UnitService] Updating unit ID=${id} with fields:`, updateFields);
            const unit = await UnitDAO.updateUnit(id, updateFields);
            if (unit) {
                logger.info(`[UnitService] Unit ID=${id} updated successfully`);
                return { unit };
            } else {
                logger.warn(`[UnitService] Unit ID=${id} not found for update`);
                return { error: 'Unit not found' };
            }
        } catch (error) {
            logger.error(`[UnitService] Error updating unit ID=${id}:`, error);
            return { error: 'Update failed' };
        }
    }

    public async deleteUnit(id: string) {
        try {
            logger.info(`[UnitService] Deleting unit with ID: ${id}`);
            await UnitDAO.deleteUnit(id);
            logger.info(`[UnitService] Unit ID=${id} deleted successfully`);
        } catch (error) {
            logger.error(`[UnitService] Error deleting unit ID=${id}:`, error);
            throw error;
        }
    }
}

export default UnitService;
