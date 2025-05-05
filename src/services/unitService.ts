import { PrismaClient, Unit } from '@prisma/client';
import { logger } from '../services/logService';
import UnitDAO from '@dao/unitDAO';

const prisma = new PrismaClient();

class UnitService {
    public async createUnit(params: { name: string; classroomId: string }): Promise<{ unit?: Unit; error?: string }> {
        try {
            logger.info('[UnitService] Validating unit creation input');

            const classroom = await prisma.virtualClassroom.findUnique({
                where: { id: params.classroomId },
            });

            if (!classroom) {
                logger.warn(`[UnitService] Invalid classroom ID=${params.classroomId}`);
                return { error: 'Invalid classroomId: No such classroom exists.' };
            }

            logger.info('[UnitService] Creating unit via DAO');
            const unit = await UnitDAO.createUnit(params);
            return { unit };
        } catch (error) {
            logger.error('[UnitService] Unexpected error during unit creation:', error);
            return { error: 'An unexpected error occurred' };
        }
    }

    public async getUnits(): Promise<Unit[]> {
        logger.info('[UnitService] Getting all units');
        return UnitDAO.getUnits();
    }

    public async getUnitById(id: string): Promise<Unit | null> {
        logger.info(`[UnitService] Getting unit by ID=${id}`);
        return UnitDAO.getUnitById(id);
    }

    public async updateUnit(id: string, updateFields: { name?: string; classroomId?: string }): Promise<{ unit?: Unit; error?: string }> {
        try {
            logger.info(`[UnitService] Updating unit ID=${id} with:`, updateFields);
            const unit = await UnitDAO.updateUnit(id, updateFields);

            return unit ? { unit } : { error: 'Unit not found' };
        } catch (error) {
            logger.error(`[UnitService] Unexpected error updating unit ID=${id}:`, error);
            return { error: 'Failed to update unit' };
        }
    }

    public async deleteUnit(id: string): Promise<void> {
        try {
            logger.info(`[UnitService] Deleting unit ID=${id}`);
            await UnitDAO.deleteUnit(id);
        } catch (error) {
            logger.error(`[UnitService] Error deleting unit ID=${id}:`, error);
            throw new Error('Failed to delete unit');
        }
    }
}

export default UnitService;
