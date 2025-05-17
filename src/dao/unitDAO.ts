import { ContentType, PrismaClient } from '@prisma/client';
import { logger } from '@services/logService';

const prisma = new PrismaClient();

interface CreateUnitInput {
    name: string;
    classroomId: string;
    educationalContents?: { contentType: string; url: string }[];
}

const UnitDAO = {
    async getClassroomById(classroomId: string) {
        return await prisma.virtualClassroom.findUnique({
            where: { id: classroomId },
        });
    },
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

    getUnitByUnitId: async (UnitId: string) => {
        try {
            logger.info(`[UnitDAO] Fetching unit by ID: ${UnitId}`);
            return await prisma.unit.findUnique({
                where: { id: UnitId },
                include: { educationalContents: true, classroom: true },
            });
        } catch (error) {
            logger.error(`[UnitDAO] Error fetching unit ID=${UnitId}:`, error);
            throw new Error('Failed to fetch unit by ID');
        }
    },

    getUnitByClassroomId: async (classroomId: string) => {
        try {
            logger.info(`[UNITDAO] Fetching unit by Virtual Classroom Id : ${classroomId}`);
            return await prisma.unit.findMany({
                where: { classroomId },
                include: {
                    educationalContents: true,
                    classroom: true
                }
            })
        }
        catch (error) {
            logger.error(`[UnitDAO] Error fetching classroom ID=${classroomId}:`, error);
            throw new Error('Failed to fetch unit by Classroom ID');
        }
    },

    updateUnit: async (id: string, updateFields: {
        name?: string; classroomId?: string, educationalContents?: { type: ContentType; content: string; version?: number }[];
    }) => {
        try {
            logger.info(`[UnitDAO] Updating unit ID=${id} with fields:`, updateFields);

            const { name, classroomId, educationalContents } = updateFields;

            const result = await prisma.$transaction(async (tx) => {
                const updatedUnit = await tx.unit.update({
                    where: { id },
                    data: { name, classroomId },
                });

                if (educationalContents) {
                    await tx.educationalContent.deleteMany({
                        where: { unitId: id },
                    });

                    await tx.educationalContent.createMany({
                        data: educationalContents.map((content) => ({
                            unitId: id,
                            type: content.type,
                            content: content.content,
                            version: content.version ?? 1,
                        })),
                    });
                }

                return tx.unit.findUnique({
                    where: { id },
                    include: { educationalContents: true },
                });
            });

            logger.info(`[UnitDAO] Unit ID=${id} updated successfully`);
            return result;
        } catch (error) {
            logger.error(`[UnitDAO] Error updating unit ID=${id}:`, error);
            throw new Error('Failed to update unit');
        }
    },

    deleteUnitByUnitId: async (UnitId: string) => {
        try {
            logger.info(`[UnitDAO] Deleting unit ID=${UnitId}`);
            const result = await prisma.unit.delete({ where: { id: UnitId } });
            logger.info(`[UnitDAO] Unit ID=${UnitId} deleted successfully`);
            return result;
        } catch (error) {
            logger.error(`[UnitDAO] Error deleting unit ID=${UnitId}:`, error);
            throw new Error('Failed to delete unit');
        }
    },
};

export default UnitDAO;
