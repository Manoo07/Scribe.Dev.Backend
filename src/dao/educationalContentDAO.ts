import { logger } from "@services/logService";
import { ContentType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EducationalContentDAO = {
    createEducationalContent: async (unitId: string, data: { content: string, type: string, version?: number }) => {
        logger.info(`[EducationalContentDAO] Creating content for unitId: ${unitId} with data: ${JSON.stringify(data)}`);
        try {
            const createdContent = await prisma.educationalContent.create({
                data: {
                    unitId,
                    content: data.content,
                    type: data.type as ContentType,
                    version: data.version ?? 1,
                },
            });
            logger.info(`[EducationalContentDAO] Successfully created content with ID: ${createdContent.id}`);
            return createdContent;
        } catch (error) {
            logger.error(`[EducationalContentDAO] Error creating content for unitId: ${unitId}`, error);
            throw error;
        }
    },

    findByUnitId: async (unitId: string) => {
        logger.info(`[EducationalContentDAO] Fetching content for unitId: ${unitId}`);
        try {
            const contents = await prisma.educationalContent.findMany({
                where: { unitId },
            });
            logger.info(`[EducationalContentDAO] Retrieved ${contents.length} contents for unitId: ${unitId}`);
            return contents;
        } catch (error) {
            logger.error(`[EducationalContentDAO] Error fetching content for unitId: ${unitId}`, error);
            throw error;
        }
    },

    updateEducationalContent: async (id: string, data: {
        type?: ContentType;
        content?: string;
        version?: number;
    }) => {
        logger.info(`[EducationalContentDAO] Updating content with ID: ${id} using data: ${JSON.stringify(data)}`);
        try {
            const updatedContent = await prisma.educationalContent.update({
                where: { id },
                data,
            });
            logger.info(`[EducationalContentDAO] Successfully updated content with ID: ${id}`);
            return updatedContent;
        } catch (error) {
            logger.error(`[EducationalContentDAO] Error updating content with ID: ${id}`, error);
            throw error;
        }
    },

    deleteEducationalContent: async (id: string) => {
        logger.info(`[EducationalContentDAO] Deleting content with ID: ${id}`);
        try {
            const deletedContent = await prisma.educationalContent.delete({
                where: { id },
            });
            logger.info(`[EducationalContentDAO] Successfully deleted content with ID: ${id}`);
            return deletedContent;
        } catch (error) {
            logger.error(`[EducationalContentDAO] Error deleting content with ID: ${id}`, error);
            throw error;
        }
    },
};

export default EducationalContentDAO;
