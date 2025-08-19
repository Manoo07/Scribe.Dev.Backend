import ThreadCommentDAO from '../dao/threadCommentDAO';
import { ThreadComment } from '@prisma/client';
import { logger } from './logService';
import UserDAO from '../dao/userDAO';

class ThreadCommentService {
       public async createThreadComment(data: Omit<ThreadComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ comment?: ThreadComment; error?: string }> {
	       try {
		       logger.info('[ThreadCommentService] Creating thread comment');
		       if (!data.userId) {
			       return { error: 'userId is required' };
		       }
		       const user = await UserDAO.get({ filter: { id: data.userId } });
		       if (!user) {
			       return { error: 'Invalid userId: User does not exist' };
		       }
		       const comment = await ThreadCommentDAO.createThreadComment(data);
		       return { comment };
	       } catch (error) {
		       logger.error('[ThreadCommentService] Error creating thread comment:', error);
		       return { error: 'Failed to create thread comment' };
	       }
       }

	public async getThreadCommentById(id: string): Promise<ThreadComment | null> {
		try {
			logger.info(`[ThreadCommentService] Getting thread comment by ID: ${id}`);
			return await ThreadCommentDAO.getThreadCommentById(id);
		} catch (error) {
			logger.error('[ThreadCommentService] Error getting thread comment by ID:', error);
			return null;
		}
	}

	public async getAllThreadComments(): Promise<ThreadComment[]> {
		try {
			logger.info('[ThreadCommentService] Getting all thread comments');
			return await ThreadCommentDAO.getAllThreadComments();
		} catch (error) {
			logger.error('[ThreadCommentService] Error getting all thread comments:', error);
			return [];
		}
	}

       public async updateThreadComment(id: string, data: Partial<ThreadComment> & { userId?: string }): Promise<{ comment?: ThreadComment; error?: string; forbidden?: boolean }> {
	       try {
		       logger.info(`[ThreadCommentService] Updating thread comment ID: ${id}`);
		       if (!data.userId) {
			       return { error: 'userId is required' };
		       }
		       const existingComment = await ThreadCommentDAO.getThreadCommentById(id);
		       if (!existingComment) {
			       return { error: 'Thread comment not found' };
		       }
		       if (existingComment.userId !== data.userId) {
			       return { error: 'You are not allowed to update this comment', forbidden: true };
		       }
		       const comment = await ThreadCommentDAO.updateThreadComment(id, data);
		       return { comment };
	       } catch (error) {
		       logger.error('[ThreadCommentService] Error updating thread comment:', error);
		       return { error: 'Failed to update thread comment' };
	       }
       }

	public async deleteThreadComment(id: string): Promise<{ comment?: ThreadComment; error?: string }> {
		try {
			logger.info(`[ThreadCommentService] Deleting thread comment ID: ${id}`);
			const comment = await ThreadCommentDAO.deleteThreadComment(id);
			return { comment };
		} catch (error) {
			logger.error('[ThreadCommentService] Error deleting thread comment:', error);
			return { error: 'Failed to delete thread comment' };
		}
	}
}

export default ThreadCommentService;
