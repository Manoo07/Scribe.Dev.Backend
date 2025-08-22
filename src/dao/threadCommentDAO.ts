import { PrismaClient, ThreadComment } from '@prisma/client';
import { logger } from '../services/logService';

const prisma = new PrismaClient();

const ThreadCommentDAO = {
	create: async (data: Omit<ThreadComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ThreadComment> => {
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

	get: async (threadCommentId: string): Promise<ThreadComment | null> => {
		try {
			logger.info(`[ThreadCommentDAO] Fetching thread comment by ID: ${threadCommentId}`);
			const comment = await prisma.threadComment.findUnique({ where: { id: threadCommentId } });
			logger.info('[ThreadCommentDAO] Thread comment fetched:', comment);
			return comment;
		} catch (error) {
			logger.error('[ThreadCommentDAO] Error fetching thread comment by ID:', error);
			throw error;
		}
	},

	getAll: async (): Promise<ThreadComment[]> => {
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

	update: async (threadCommentId: string, data: Partial<ThreadComment>): Promise<ThreadComment> => {
		try {
			logger.info(`[ThreadCommentDAO] Updating thread comment ID: ${threadCommentId}`);
			const comment = await prisma.threadComment.update({ where: { id: threadCommentId }, data });
			logger.info('[ThreadCommentDAO] Thread comment updated:', comment);
			return comment;
		} catch (error) {
			logger.error('[ThreadCommentDAO] Error updating thread comment:', error);
			throw error;
		}
	},

	delete: async (threadCommentId: string): Promise<ThreadComment> => {
		try {
			logger.info(`[ThreadCommentDAO] Deleting thread comment ID: ${threadCommentId}`);
			const comment = await prisma.threadComment.delete({ where: { id: threadCommentId } });
			logger.info('[ThreadCommentDAO] Thread comment deleted:', comment);
			return comment;
		} catch (error) {
			logger.error('[ThreadCommentDAO] Error deleting thread comment:', error);
			throw error;
		}
	},
};

export default ThreadCommentDAO;
