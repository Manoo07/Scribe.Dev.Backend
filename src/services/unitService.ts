import { PrismaClient } from '@prisma/client';
import UnitDAO from '@dao/unitDAO';
import { logger } from '../services/logService';

const prisma = new PrismaClient();


class UnitService {


    public async createUnit(params: { name: string; classroomId: string; educationalContents?: any[] }) {
        try {
            logger.info('[UnitService] Creating unit with params:', params);
            const classroom = await UnitDAO.getClassroomById(params.classroomId);
            if (!classroom) {
                logger.warn(`[UnitService] Invalid classroomId: ${params.classroomId}`);
                throw new Error('Invalid classroomId');
            }

            const unit = await UnitDAO.createUnit(params);
            logger.info('[UnitService] Unit created successfully:', unit);
            return unit;
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

    public async getUnitByUnitId(id: string) {
        try {
            logger.info(`[UnitService] Fetching unit with ID: ${id}`);
            const unit = await UnitDAO.getUnitByUnitId(id);
            logger.info(`[UnitService] Unit fetched successfully for ID=${id}`);
            return unit;
        } catch (error) {
            logger.error(`[UnitService] Error fetching unit ID=${id}:`, error);
            throw error;
        }
    }

    public async getUnitByClassroomId(classroomId: string) {
        try {
            logger.info(`[UNITService] Fetching unit for Classroom ID=${classroomId} `);
            const unit = await UnitDAO.getUnitByClassroomId(classroomId);
            logger.info(`[UnitService] Unit fetched successfully for ID=${classroomId}`);
            return unit;
        }
        catch (error) {
            logger.error(`[UnitService] Error while fetching Classroom ID=${classroomId}`, error);
            throw error;
        }
    }

    public async updateUnit(UnitId: string, updateFields: any) {
        try {
            logger.info(`[UnitService] Updating unit ID=${UnitId} with fields:`, updateFields);
            const unit = await UnitDAO.updateUnit(UnitId, updateFields);
            if (unit) {
                logger.info(`[UnitService] Unit ID=${UnitId} updated successfully`);
                return unit;
            } else {
                logger.warn(`[UnitService] Unit ID=${UnitId} not found for update`);
                throw new Error('Unit not found')
            }
        } catch (error) {
            logger.error(`[UnitService] Error updating unit ID=${UnitId}:`, error);
            return { error: 'Update failed' };
        }
    }

    public async deleteUnit(id: string) {
        try {
            logger.info(`[UnitService] Deleting unit with ID: ${id}`);
            await UnitDAO.deleteUnitByUnitId(id);
            logger.info(`[UnitService] Unit ID=${id} deleted successfully`);
        } catch (error) {
            logger.error(`[UnitService] Error deleting unit ID=${id}:`, error);
            throw error;
        }
    }
}

export default UnitService;
