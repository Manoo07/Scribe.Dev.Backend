import ThreadLikeDAO from '../dao/threadLikeDAO';
import { ThreadLike } from '@prisma/client';
import { logger } from './logService';

class ThreadLikeService {
       public async createThreadLike(data: { userId: string; threadCommentId: string }): Promise<{ like?: ThreadLike; error?: string }> {
	       try {
		       logger.info('[ThreadLikeService] Creating thread like');
		       const like = await ThreadLikeDAO.createThreadLike({
			       userId: data.userId,
			       threadCommentId: data.threadCommentId
		       });
		       return { like };
	       } catch (error) {
		       logger.error('[ThreadLikeService] Error creating thread like:', error);
		       return { error: 'Failed to create thread like' };
	       }
       }

	public async getThreadLikeById(id: string): Promise<ThreadLike | null> {
		try {
			logger.info(`[ThreadLikeService] Getting thread like by ID: ${id}`);
			return await ThreadLikeDAO.getThreadLikeById(id);
		} catch (error) {
			logger.error('[ThreadLikeService] Error getting thread like by ID:', error);
			return null;
		}
	}

	public async getAllThreadLikes(): Promise<ThreadLike[]> {
		try {
			logger.info('[ThreadLikeService] Getting all thread likes');
			return await ThreadLikeDAO.getAllThreadLikes();
		} catch (error) {
			logger.error('[ThreadLikeService] Error getting all thread likes:', error);
			return [];
		}
	}

       public async updateThreadLike(id: string, data: { userId?: string; threadCommentId?: string }): Promise<{ like?: ThreadLike; error?: string }> {
	       try {
		       logger.info(`[ThreadLikeService] Updating thread like ID: ${id}`);
		       // Only allow updating userId and threadCommentId
		       const updateData: { userId?: string; threadCommentId?: string } = {};
		       if (data.userId) updateData.userId = data.userId;
		       if (data.threadCommentId) updateData.threadCommentId = data.threadCommentId;
		       const like = await ThreadLikeDAO.updateThreadLike(id, updateData);
		       return { like };
	       } catch (error) {
		       logger.error('[ThreadLikeService] Error updating thread like:', error);
		       return { error: 'Failed to update thread like' };
	       }
       }

	public async deleteThreadLike(id: string): Promise<{ like?: ThreadLike; error?: string }> {
		try {
			logger.info(`[ThreadLikeService] Deleting thread like ID: ${id}`);
			const like = await ThreadLikeDAO.deleteThreadLike(id);
			return { like };
		} catch (error) {
			logger.error('[ThreadLikeService] Error deleting thread like:', error);
			return { error: 'Failed to delete thread like' };
		}
	}
}

export default ThreadLikeService;
