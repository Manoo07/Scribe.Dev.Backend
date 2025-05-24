import { logger } from "@services/logService";
import { ContentType, EducationalContent, PrismaClient } from "@prisma/client";
import { buildWhereClause } from "@utils/DBPipelines/filterObjectBuilder";

const prisma = new PrismaClient();

const EducationalContentDAO = {
    create: async (unitId: string, data: { content: string, type: string }) => {
        logger.info(`[EducationalContentDAO] Creating content for unitId: ${unitId} with data: ${JSON.stringify(data)}`);
        try {
            const createdContent = await prisma.educationalContent.create({
                data: {
                    unitId,
                    content: data.content,
                    type: data.type as ContentType,
                },
            });
            logger.info(`[EducationalContentDAO] Successfully created content with ID: ${createdContent.id}`);
            return createdContent;
        } catch (error) {
            logger.error(`[EducationalContentDAO] Error creating content for unitId: ${unitId}`, error);
            throw error;
        }
    },

    get: async (unitId: string) => {
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

    getAll: async (filters: Record<string, any> = {}): Promise<EducationalContent[]> => {
        try {
            logger.info('[EducationalContentDAO] Fetching educational contents with filters:', filters);
            const queryFilter = buildWhereClause(filters);

            const educationalContents = await prisma.educationalContent.findMany({
                where: queryFilter,
                include: {
                    unit: true
                }
            });
            logger.info(`[EducationalContentDAO] Fetched ${educationalContents.length} contents`);
            return educationalContents;
        } catch (error) {
            logger.error('[EducationalContentDAO] Error fetching educational Contents with filters:', error);
            throw error;
        }
    },




    update: async (educationalContentId: string, data: {
        type?: ContentType;
        content?: string;
    }) => {
        logger.info(`[EducationalContentDAO] Updating content with ID: ${educationalContentId} using data: ${JSON.stringify(data)}`);
        try {
            const existingContent = await prisma.educationalContent.findUnique({
                where: { id: educationalContentId },
            });
            if (!existingContent) {
                logger.warn(`[EducationalContentDAO] No content found with ID: ${educationalContentId}`);
                throw new Error(`Educational content with ID ${educationalContentId} not found`);
            }
            const updatedContent = await prisma.educationalContent.update({
                where: { id: educationalContentId },
                data,
            });
            logger.info(`[EducationalContentDAO] Successfully updated content with ID: ${educationalContentId}`);
            return updatedContent;
        } catch (error) {
            logger.error(`[EducationalContentDAO] Error updating content with ID: ${educationalContentId}`, error);
            throw error;
        }
    },

    delete: async (educationalContentId: string) => {
        logger.info(`[EducationalContentDAO] Deleting content with ID: ${educationalContentId}`);
        try {
            const deletedContent = await prisma.educationalContent.delete({
                where: { id: educationalContentId },
            });
            logger.info(`[EducationalContentDAO] Successfully deleted content with ID: ${educationalContentId}`);
            return deletedContent;
        } catch (error) {
            logger.error(`[EducationalContentDAO] Error deleting content with ID: ${educationalContentId}`, error);
            throw error;
        }
    },
};

export default EducationalContentDAO;