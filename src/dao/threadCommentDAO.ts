import { PrismaClient, ThreadComment } from '@prisma/client';
import { logger } from '../services/logService';

const prisma = new PrismaClient();

const ThreadCommentDAO = {
	createThreadComment: async (data: Omit<ThreadComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ThreadComment> => {
		try {
			logger.info('[ThreadCommentDAO] Creating thread comment:', data);
			const comment = await prisma.threadComment.create({ data });
			logger.info('[ThreadCommentDAO] Thread comment created:', comment);
			return comment;
		} catch (error) {
			logger.error('[ThreadCommentDAO] Error creating thread comment:', error);
			throw error;
		}
	},

	getThreadCommentById: async (id: string): Promise<ThreadComment | null> => {
		try {
			logger.info(`[ThreadCommentDAO] Fetching thread comment by ID: ${id}`);
			const comment = await prisma.threadComment.findUnique({ where: { id } });
			logger.info('[ThreadCommentDAO] Thread comment fetched:', comment);
			return comment;
		} catch (error) {
			logger.error('[ThreadCommentDAO] Error fetching thread comment by ID:', error);
			throw error;
		}
	},

	getAllThreadComments: async (): Promise<ThreadComment[]> => {
		try {
			logger.info('[ThreadCommentDAO] Fetching all thread comments');
			const comments = await prisma.threadComment.findMany();
			logger.info(`[ThreadCommentDAO] Fetched ${comments.length} thread comments`);
			return comments;
		} catch (error) {
			logger.error('[ThreadCommentDAO] Error fetching thread comments:', error);
			throw error;
		}
	},

	updateThreadComment: async (id: string, data: Partial<ThreadComment>): Promise<ThreadComment> => {
		try {
			logger.info(`[ThreadCommentDAO] Updating thread comment ID: ${id}`);
			const comment = await prisma.threadComment.update({ where: { id }, data });
			logger.info('[ThreadCommentDAO] Thread comment updated:', comment);
			return comment;
		} catch (error) {
			logger.error('[ThreadCommentDAO] Error updating thread comment:', error);
			throw error;
		}
	},

	deleteThreadComment: async (id: string): Promise<ThreadComment> => {
		try {
			logger.info(`[ThreadCommentDAO] Deleting thread comment ID: ${id}`);
			const comment = await prisma.threadComment.delete({ where: { id } });
			logger.info('[ThreadCommentDAO] Thread comment deleted:', comment);
			return comment;
		} catch (error) {
			logger.error('[ThreadCommentDAO] Error deleting thread comment:', error);
			throw error;
		}
	},
};

export default ThreadCommentDAO;
