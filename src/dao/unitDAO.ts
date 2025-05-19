import { ContentType, Prisma, PrismaClient, Unit } from '@prisma/client';
import { logger } from '@services/logService';
import { buildWhereClause } from '@utils/DBPipelines/filterObjectBuilder';

const prisma = new PrismaClient();
interface CreateUnitInput {
    name: string;
    description: string;
    classroomId: string;
    educationalContents?: { contentType: string; url: string }[];
}

const UnitDAO = {
    create: async ({ name, classroomId, description, educationalContents = [] }: CreateUnitInput) => {
        try {
            logger.info('[UnitDAO] Creating unit with educational content');

            const data: Prisma.UnitCreateInput = {
                name,
                description,
                classroom: {
                    connect: { id: classroomId },
                },
                ...(educationalContents.length > 0 && {
                    educationalContents: {
                        create: educationalContents.map((ec) => ({
                            type: ec.contentType.toUpperCase() as ContentType,
                            content: ec.url,
                        })),
                    },
                }),
            };

            const result = await prisma.unit.create({
                data,
                include: { educationalContents: true },
            });

            logger.info('[UnitDAO] Unit created successfully');
            return result;
        } catch (error) {
            logger.error('[UnitDAO] Error creating unit:', error);
            throw new Error('Failed to create unit');
        }
    },

    get: async (UnitId: string) => {
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



    getAll: async (filters: Record<string, any> = {}): Promise<Unit[]> => {
        try {
            logger.info('[UnitDAO] Fetching units with filters:', filters);
            const queryFilter = buildWhereClause(filters);

            const units = await prisma.unit.findMany({
                where: queryFilter,
                include: {
                    classroom: true,
                    educationalContents: true,
                },
            });

            return units;
        } catch (error) {
            logger.error('[UnitDAO] Error fetching filtered units:', error);
            throw error;
        }
    },


    update: async (id: string, updateFields: { name: string; description: string }) => {
        try {
            logger.info(`[UnitDAO] Updating unit ID=${id} with fields:`, updateFields);
            const result = await prisma.unit.update({
                where: { id },
                data: {
                    name: updateFields.name,
                    description: updateFields.description
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

    delete: async (UnitId: string) => {
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
