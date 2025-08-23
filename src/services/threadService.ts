
import ThreadDAO from '../dao/threadDAO';
import { Thread } from '@prisma/client';
import { logger } from './logService';

export class ThreadService {
       public async create(data: Omit<Thread, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ thread?: Thread; error?: string }> {
	      try {
		      logger.info('[ThreadService] Creating thread');
		      const thread = await ThreadDAO.create(data);
		      return { thread };
	      } catch (error) {
		      logger.error('[ThreadService] Error creating thread:', error);
		      return { error: 'Failed to create thread' };
	      }
       }

       public async get(threadId: string): Promise<Thread | null> {
	       try {
		       logger.info(`[ThreadService] Getting thread by ID: ${threadId}`);
		       return await ThreadDAO.get(threadId);
	       } catch (error) {
		       logger.error('[ThreadService] Error getting thread by ID:', error);
		       return null;
	       }
       }

       public async getAll(pagination?: { pageSize?: number; pageNumber?: number }): Promise<{ threads?: Thread[]; error?: string }> {
	       try {
		       logger.info('[ThreadService] Getting all threads');
		       const threads = await ThreadDAO.getAll(pagination);
		       return { threads };
	       } catch (error) {
		       logger.error('[ThreadService] Error getting all threads:', error);
		       return { error: 'Failed to get all threads' };
	       }
       }

       public async update(threadId: string, data: Partial<Thread>): Promise<{ thread?: Thread; error?: string }> {
	       try {
		       logger.info(`[ThreadService] Updating thread ID: ${threadId}`);
		       const updatedThread = await ThreadDAO.update(threadId, data);
		       return { thread: updatedThread };
	       } catch (error) {
		       logger.error('[ThreadService] Error updating thread:', error);
		       return { error: 'Failed to update thread' };
	       }
       }

       public async delete(threadId: string): Promise<{ thread?: Thread; error?: string }> {
	       try {
		       logger.info(`[ThreadService] Deleting thread ID: ${threadId}`);
		       const deletedThread = await ThreadDAO.delete(threadId);
		       return { thread: deletedThread };
	       } catch (error) {
		       logger.error('[ThreadService] Error deleting thread:', error);
		       return { error: 'Failed to delete thread' };
	       }
       }
}


const threadService = new ThreadService();
export default threadService;
