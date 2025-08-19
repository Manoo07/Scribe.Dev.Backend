import { PrismaClient, Thread } from '@prisma/client';
import { logger } from '../services/logService';

const prisma = new PrismaClient();

const ThreadDAO = {
	create: async (data: Omit<Thread, 'id' | 'createdAt' | 'updatedAt'>): Promise<Thread> => {
		try {
			logger.info('[ThreadDAO] Creating thread:', data);
			const thread = await prisma.thread.create({ data });
			logger.info('[ThreadDAO] Thread created:', thread);
			return thread;
		} catch (error) {
			logger.error('[ThreadDAO] Error creating thread:', error);
			throw error;
		}
	},

	get: async (id: string): Promise<Thread | null> => {
		try {
			logger.info(`[ThreadDAO] Fetching thread by ID: ${id}`);
			const thread = await prisma.thread.findUnique({ where: { id } });
			logger.info('[ThreadDAO] Thread fetched:', thread);
			return thread;
		} catch (error) {
			logger.error('[ThreadDAO] Error fetching thread by ID:', error);
			throw error;
		}
	},

	getAll: async (): Promise<Thread[]> => {
		try {
			logger.info('[ThreadDAO] Fetching all threads');
			const threads = await prisma.thread.findMany();
			logger.info(`[ThreadDAO] Fetched ${threads.length} threads`);
			return threads;
		} catch (error) {
			logger.error('[ThreadDAO] Error fetching threads:', error);
			throw error;
		}
	},

	update: async (id: string, data: Partial<Thread>): Promise<Thread> => {
		try {
			logger.info(`[ThreadDAO] Updating thread ID: ${id}`);
			const thread = await prisma.thread.update({ where: { id }, data });
			logger.info('[ThreadDAO] Thread updated:', thread);
			return thread;
		} catch (error) {
			logger.error('[ThreadDAO] Error updating thread:', error);
			throw error;
		}
	},

	delete: async (id: string): Promise<Thread> => {
		try {
			logger.info(`[ThreadDAO] Deleting thread ID: ${id}`);
			const thread = await prisma.thread.delete({ where: { id } });
			logger.info('[ThreadDAO] Thread deleted:', thread);
			return thread;
		} catch (error) {
			logger.error('[ThreadDAO] Error deleting thread:', error);
			throw error;
		}
	},
};

export default ThreadDAO;
