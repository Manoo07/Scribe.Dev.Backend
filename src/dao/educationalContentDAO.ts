import { logger } from "@services/logService";
import { ContentType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


const EducationalContentDAO = {
    create: async (unitId: string, data: { content: string, type: string, version?: number }) => {
        try {
            return await prisma.educationalContent.create({
                data: {
                    unitId,
                    content: data.content,
                    type: data.type as ContentType,
                    version: data.version ?? 1,
                },
            });
        } catch (error) {
            logger.error('[EducationalContentDAO] Error creating content:', error);
            throw error;
        }
    },

    findByUnitId: async (unitId: string) => {
        try {
            return await prisma.educationalContent.findMany({
                where: { unitId },
            });
        } catch (error) {
            logger.error('[EducationalContentDAO] Error fetching by unit ID:', error);
            throw error;
        }
    },

    update: async (id: string, data: Record<string, any>) => {
        try {
            return await prisma.educationalContent.update({
                where: { id },
                data,
            });
        } catch (error) {
            logger.error('[EducationalContentDAO] Error updating content:', error);
            throw error;
        }
    },

    delete: async (id: string) => {
        try {
            return await prisma.educationalContent.delete({
                where: { id },
            });
        } catch (error) {
            logger.error('[EducationalContentDAO] Error deleting content:', error);
            throw error;
        }
    },
};


export default EducationalContentDAO;
