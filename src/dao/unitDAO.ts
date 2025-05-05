import { PrismaClient, Unit } from '@prisma/client';
import { logger } from '../services/logService';

const prisma = new PrismaClient();

const UnitDAO = {
    createUnit: async (data: { name: string; classroomId: string }): Promise<Unit> => {
        try {
            logger.info('[UnitDAO] Creating unit:', data);
            const unit = await prisma.unit.create({ data });
            logger.info('[UnitDAO] Unit created:', unit);
            return unit;
        } catch (error) {
            logger.error('[UnitDAO] Error creating unit:', error);
            throw error;
        }
    },

    getUnits: async (): Promise<Unit[]> => {
        try {
            logger.info('[UnitDAO] Fetching all units');
            const units = await prisma.unit.findMany({ include: { classroom: true } });
            logger.info(`[UnitDAO] Fetched ${units.length} units`);
            return units;
        } catch (error) {
            logger.error('[UnitDAO] Error fetching units:', error);
            throw error;
        }
    },

    getUnitById: async (id: string): Promise<Unit | null> => {
        try {
            logger.info(`[UnitDAO] Fetching unit by ID: ${id}`);
            const unit = await prisma.unit.findUnique({ where: { id }, include: { classroom: true } });
            return unit;
        } catch (error) {
            logger.error(`[UnitDAO] Error fetching unit ID=${id}:`, error);
            throw error;
        }
    },

    updateUnit: async (id: string, updateFields: Partial<Unit>): Promise<Unit | null> => {
        try {
            logger.info(`[UnitDAO] Updating unit ID=${id} with:`, updateFields);
            const updated = await prisma.unit.update({ where: { id }, data: updateFields });
            logger.info('[UnitDAO] Unit updated:', updated);
            return updated;
        } catch (error) {
            logger.error(`[UnitDAO] Error updating unit ID=${id}:`, error);
            throw error;
        }
    },

    deleteUnit: async (id: string): Promise<void> => {
        try {
            logger.info(`[UnitDAO] Deleting unit ID=${id}`);
            await prisma.unit.delete({ where: { id } });
            logger.info('[UnitDAO] Unit deleted successfully');
        } catch (error) {
            logger.error(`[UnitDAO] Error deleting unit ID=${id}:`, error);
            throw error;
        }
    },
};

export default UnitDAO;
