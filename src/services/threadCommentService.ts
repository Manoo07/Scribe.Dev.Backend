import ThreadCommentDAO from '../dao/threadCommentDAO';
import { ThreadComment } from '@prisma/client';
import { logger } from './logService';
import UserDAO from '../dao/userDAO';

class ThreadCommentService {
       public async create(data: Omit<ThreadComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ comment?: ThreadComment; error?: string }> {
	      try {
		      logger.info('[ThreadCommentService] Creating thread comment');
		      const createdComment = await ThreadCommentDAO.create(data);
		      return { comment: createdComment };
	      } catch (error) {
		      logger.error('[ThreadCommentService] Error creating thread comment:', error);
		      return { error: 'Failed to create thread comment' };
	      }
       }

       public async get(threadCommentId: string): Promise<ThreadComment | null> {
	       try {
		       logger.info(`[ThreadCommentService] Getting thread comment by ID: ${threadCommentId}`);
		       return await ThreadCommentDAO.get(threadCommentId);
	       } catch (error) {
		       logger.error('[ThreadCommentService] Error getting thread comment by ID:', error);
		       return null;
	       }
       }

	public async getAll(): Promise<ThreadComment[]> {
		try {
			logger.info('[ThreadCommentService] Getting all thread comments');
			return await ThreadCommentDAO.getAll();
		} catch (error) {
			logger.error('[ThreadCommentService] Error getting all thread comments:', error);
			return [];
		}
	}

       public async update(threadCommentId: string, data: Partial<ThreadComment> & { userId?: string }): Promise<{ comment?: ThreadComment; error?: string; forbidden?: boolean }> {
	      try {
		      logger.info(`[ThreadCommentService] Updating thread comment ID: ${threadCommentId}`);
		      const updatedComment = await ThreadCommentDAO.update(threadCommentId, data);
		      return { comment: updatedComment };
	      } catch (error) {
		      logger.error('[ThreadCommentService] Error updating thread comment:', error);
		      return { error: 'Failed to update thread comment' };
	      }
       }

       public async delete(threadCommentId: string): Promise<{ comment?: ThreadComment; error?: string }> {
	       try {
		       logger.info(`[ThreadCommentService] Deleting thread comment ID: ${threadCommentId}`);
		       const deletedThreadComment = await ThreadCommentDAO.delete(threadCommentId);
		       return { comment: deletedThreadComment };
	       } catch (error) {
		       logger.error('[ThreadCommentService] Error deleting thread comment:', error);
		       return { error: 'Failed to delete thread comment' };
	       }
       }
}

export default ThreadCommentService;
