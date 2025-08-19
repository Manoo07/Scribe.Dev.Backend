import { PrismaClient, ThreadLike } from '@prisma/client';
import { logger } from '../services/logService';

const prisma = new PrismaClient();



const ThreadLikeDAO = {
		createThreadLike: async (data: { userId: string; threadCommentId: string }): Promise<ThreadLike> => {
			try {
				logger.info('[ThreadLikeDAO] Creating thread like:', data);
					const like = await prisma.threadLike.create({
						data: {
							userId: data.userId,
							threadCommentId: data.threadCommentId
						}
					});
				logger.info('[ThreadLikeDAO] Thread like created:', like);
				return like;
			} catch (error) {
				logger.error('[ThreadLikeDAO] Error creating thread like:', error);
				throw error;
			}
		},

	getThreadLikeById: async (id: string): Promise<ThreadLike | null> => {
		try {
			logger.info(`[ThreadLikeDAO] Fetching thread like by ID: ${id}`);
			const like = await prisma.threadLike.findUnique({ where: { id } });
			logger.info('[ThreadLikeDAO] Thread like fetched:', like);
			return like;
		} catch (error) {
			logger.error('[ThreadLikeDAO] Error fetching thread like by ID:', error);
			throw error;
		}
	},

	getAllThreadLikes: async (): Promise<ThreadLike[]> => {
		try {
			logger.info('[ThreadLikeDAO] Fetching all thread likes');
			const likes = await prisma.threadLike.findMany();
			logger.info(`[ThreadLikeDAO] Fetched ${likes.length} thread likes`);
			return likes;
		} catch (error) {
			logger.error('[ThreadLikeDAO] Error fetching thread likes:', error);
			throw error;
		}
	},

				updateThreadLike: async (id: string, data: { userId?: string; threadCommentId?: string }): Promise<ThreadLike> => {
					try {
						logger.info(`[ThreadLikeDAO] Updating thread like ID: ${id}`);
						const updateData: any = {};
						if (data.userId) updateData.userId = data.userId;
						if (data.threadCommentId) updateData.threadCommentId = data.threadCommentId;
						const like = await prisma.threadLike.update({
							where: { id },
							data: updateData
						});
						logger.info('[ThreadLikeDAO] Thread like updated:', like);
						return like;
					} catch (error) {
						logger.error('[ThreadLikeDAO] Error updating thread like:', error);
						throw error;
					}
				},

	deleteThreadLike: async (id: string): Promise<ThreadLike> => {
		try {
			logger.info(`[ThreadLikeDAO] Deleting thread like ID: ${id}`);
			const like = await prisma.threadLike.delete({ where: { id } });
			logger.info('[ThreadLikeDAO] Thread like deleted:', like);
			return like;
		} catch (error) {
			logger.error('[ThreadLikeDAO] Error deleting thread like:', error);
			throw error;
		}
	},
};

export default ThreadLikeDAO;
