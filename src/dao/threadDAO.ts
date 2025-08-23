import { Thread } from '@prisma/client';
import { logger } from '../services/logService';
import prisma from '../prisma/prismaClient';

const ThreadDAO = {
	create: async (data: Omit<Thread, 'id' | 'createdAt' | 'updatedAt'>): Promise<Thread> => {
		try {
			   logger.info('[ThreadDAO] Creating thread:', data);
			   const createdThread = await prisma.thread.create({ data });
			   logger.info('[ThreadDAO] Thread created:', createdThread);
			   return createdThread;
		} catch (error) {
			logger.error('[ThreadDAO] Error creating thread:', error);
			throw error;
		}
	},

       get: async (threadId: string): Promise<Thread | null> => {
	       try {
		       logger.info(`[ThreadDAO] Fetching thread by ID: ${threadId}`);
		       const thread = await prisma.thread.findUnique({ where: { id: threadId } });
		       logger.info('[ThreadDAO] Thread fetched:', thread);
		       return thread;
	       } catch (error) {
		       logger.error('[ThreadDAO] Error fetching thread by ID:', error);
		       throw error;
	       }
       },

	getAll: async (pagination?: { pageSize?: number; pageNumber?: number }): Promise<Thread[]> => {
		try {
			logger.info('[ThreadDAO] Fetching all threads');
			const { pageSize = 10, pageNumber = 1 } = pagination || {};
			const recordsToSkip = (pageNumber - 1) * pageSize;
			const allThreads = await prisma.thread.findMany({ skip: recordsToSkip, take: pageSize });
			logger.info(`[ThreadDAO] Fetched ${allThreads.length} threads`);
			return allThreads;
		} catch (error) {
			logger.error('[ThreadDAO] Error fetching threads:', error);
			throw error;
		}
	},

       update: async (threadId: string, data: Partial<Thread>): Promise<Thread> => {
	       try {
		       logger.info(`[ThreadDAO] Updating thread ID: ${threadId}`);
		       const updatedThread = await prisma.thread.update({ where: { id: threadId }, data });
		       logger.info('[ThreadDAO] Thread updated:', updatedThread);
		       return updatedThread;
	       } catch (error) {
		       logger.error('[ThreadDAO] Error updating thread:', error);
		       throw error;
	       }
       },

       delete: async (threadId: string): Promise<Thread> => {
	       try {
		       logger.info(`[ThreadDAO] Deleting thread ID: ${threadId}`);
		       const deletedThread = await prisma.thread.delete({ where: { id: threadId } });
		       logger.info('[ThreadDAO] Thread deleted:', deletedThread);
		       return deletedThread;
	       } catch (error) {
		       logger.error('[ThreadDAO] Error deleting thread:', error);
		       throw error;
	       }
       },
};

export default ThreadDAO;
