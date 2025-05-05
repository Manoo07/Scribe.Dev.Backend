import { ContentType, PrismaClient } from '@prisma/client';
import { logger } from '@services/logService';

const prisma = new PrismaClient();

interface CreateUnitInput {
    name: string;
    classroomId: string;
    educationalContents?: { contentType: string; url: string }[];
}

const UnitDAO = {
    createUnit: async ({ name, classroomId, educationalContents = [] }: CreateUnitInput) => {
        try {
            logger.info('[UnitDAO] Creating unit with educational content');
            const result = await prisma.unit.create({
                data: {
                    name,
                    classroomId,
                    educationalContents: {
                        create: educationalContents.map((ec) => ({
                            type: ec.contentType.toUpperCase() as ContentType,
                            content: ec.url,
                        })),
                    },
                },
                include: { educationalContents: true },
            });
            logger.info('[UnitDAO] Unit created successfully');
            return result;
        } catch (error) {
            logger.error('[UnitDAO] Error creating unit:', error);
            throw new Error('Failed to create unit');
        }
    },

    getUnits: async () => {
        try {
            logger.info('[UnitDAO] Fetching all units');
            return await prisma.unit.findMany({ include: { educationalContents: true, classroom: true } });
        } catch (error) {
            logger.error('[UnitDAO] Error fetching units:', error);
            throw new Error('Failed to fetch units');
        }
    },

    getUnitById: async (id: string) => {
        try {
            logger.info(`[UnitDAO] Fetching unit by ID: ${id}`);
            return await prisma.unit.findUnique({
                where: { id },
                include: { educationalContents: true, classroom: true },
            });
        } catch (error) {
            logger.error(`[UnitDAO] Error fetching unit ID=${id}:`, error);
            throw new Error('Failed to fetch unit by ID');
        }
    },

    updateUnit: async (id: string, updateFields: { name?: string; classroomId?: string }) => {
        try {
            logger.info(`[UnitDAO] Updating unit ID=${id} with fields:`, updateFields);
            const result = await prisma.unit.update({
                where: { id },
                data: {
                    name: updateFields.name,
                    classroomId: updateFields.classroomId,
                },
                include: { educationalContents: true },
            });
            logger.info(`[UnitDAO] Unit ID=${id} updated successfully`);
            return result;
        } catch (error) {
            logger.error(`[UnitDAO] Error updating unit ID=${id}:`, error);
            throw new Error('Failed to update unit');
        }
    },

    deleteUnit: async (id: string) => {
        try {
            logger.info(`[UnitDAO] Deleting unit ID=${id}`);
            const result = await prisma.unit.delete({ where: { id } });
            logger.info(`[UnitDAO] Unit ID=${id} deleted successfully`);
            return result;
        } catch (error) {
            logger.error(`[UnitDAO] Error deleting unit ID=${id}:`, error);
            throw new Error('Failed to delete unit');
        }
    },
};

export default UnitDAO;
