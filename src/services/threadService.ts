
import ThreadDAO from '../dao/threadDAO';
import UnitDAO from '../dao/unitDAO';
import { Thread } from '@prisma/client';
import { logger } from './logService';

export class ThreadService {
       public async createThread(data: Omit<Thread, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ thread?: Thread; error?: string }> {
	       try {
		       logger.info('[ThreadService] Creating thread');
		       // Validate unitId existence
		       if (!data.unitId) {
			       return { error: 'unitId is required' };
		       }
		       const unit = await UnitDAO.get(data.unitId);
		       if (!unit) {
			       return { error: 'Invalid unitId: Unit does not exist' };
		       }
		       const thread = await ThreadDAO.create(data);
		       return { thread };
	       } catch (error) {
		       logger.error('[ThreadService] Error creating thread:', error);
		       return { error: 'Failed to create thread' };
	       }
       }

	public async getThreadById(id: string): Promise<Thread | null> {
		try {
			logger.info(`[ThreadService] Getting thread by ID: ${id}`);
			return await ThreadDAO.get(id);
		} catch (error) {
			logger.error('[ThreadService] Error getting thread by ID:', error);
			return null;
		}
	}

       public async getAllThreads(): Promise<{ threads?: Thread[]; error?: string }> {
	       try {
		       logger.info('[ThreadService] Getting all threads');
		       const threads = await ThreadDAO.getAll();
		       return { threads };
	       } catch (error) {
		       logger.error('[ThreadService] Error getting all threads:', error);
		       return { error: 'Failed to get all threads' };
	       }
       }

	public async updateThread(id: string, data: Partial<Thread>): Promise<{ thread?: Thread; error?: string }> {
		try {
			logger.info(`[ThreadService] Updating thread ID: ${id}`);
			const thread = await ThreadDAO.update(id, data);
			return { thread };
		} catch (error) {
			logger.error('[ThreadService] Error updating thread:', error);
			return { error: 'Failed to update thread' };
		}
	}

	public async deleteThread(id: string): Promise<{ thread?: Thread; error?: string }> {
		try {
			logger.info(`[ThreadService] Deleting thread ID: ${id}`);
			const thread = await ThreadDAO.delete(id);
			return { thread };
		} catch (error) {
			logger.error('[ThreadService] Error deleting thread:', error);
			return { error: 'Failed to delete thread' };
		}
	}
}


const threadService = new ThreadService();
export default threadService;
