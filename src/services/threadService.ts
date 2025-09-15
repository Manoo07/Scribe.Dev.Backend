import { threadDAO } from '@dao/threadDAO';
import { ThreadStatus } from '@prisma/client';
import { logger } from '@services/logService';
export const threadService = {
  async updateThreadOrComment(threadId: string, userId: string, data: { title?: string; content?: string }) {
    return await threadDAO.updateThreadOrComment(threadId, userId, data);
  },
  async deleteThreadOrComment(threadId: string, userId: string) {
    return await threadDAO.deleteThreadOrComment(threadId, userId);
  },
  async likeThreadOrReply({ threadId, replyId, userId }: { threadId?: string; replyId?: string; userId: string }) {
    try {
      logger.info('[threadService] likeThreadOrReply started', { threadId, replyId, userId });
      const { likeDAO } = await import('@dao/likeDAO');
      const id = threadId || replyId;
      if (!id) throw new Error('threadId or replyId required');
      // Toggle like: if exists, delete (unlike), else create (like)
      const result = await likeDAO.toggleLike({ threadId, replyId, userId });
      logger.info('[threadService] likeThreadOrReply toggled', { threadId: id, userId, liked: result.liked });
      return result;
    } catch (error) {
      logger.error('[threadService] likeThreadOrReply error', {
        error: error instanceof Error ? error.message : error,
        threadId,
        replyId,
        userId,
      });
      throw error;
    }
  },
  async getThreadById(threadId: string) {
    // Used for ownership validation in acceptAnswer
    return await threadDAO.getThreadById(threadId);
  },
  async createThread(data: any, userId: string) {
    try {
      logger.info('[threadService] createThread started', { userId });
      const result = await threadDAO.createThread({ ...data, userId });
      logger.info('[threadService] createThread success', { threadId: result.id });
      return result;
    } catch (error) {
      logger.error('[threadService] createThread error', {
        error: error instanceof Error ? error.message : error,
        userId,
      });
      throw error;
    }
  },
  async getThreads(
    page: number,
    limit: number,
    options: {
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      unitId?: string | null;
      threadStatus?: string;
      filters?: Record<string, any>;
      userId: string;
    },
  ) {
    try {
      logger.info('[threadService] getThreads started', { page, limit, ...options });
      // Convert known enum filters if present
      const filters = { ...options.filters };
      if (filters.threadStatus && typeof filters.threadStatus === 'string') {
        // Lazy import to avoid circular
        const { ThreadStatus } = await import('@prisma/client');
        if (Object.values(ThreadStatus).includes(filters.threadStatus as ThreadStatus)) {
          filters.threadStatus = filters.threadStatus as ThreadStatus;
        }
      }
      const result = await threadDAO.getThreads(page, limit, {
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
        filters,
        userId: options.userId,
      });
      logger.info('[threadService] getThreads success', { count: result.threads.length });
      return result;
    } catch (error) {
      logger.error('[threadService] getThreads error', {
        error: error instanceof Error ? error.message : error,
        page,
        limit,
        ...options,
      });
      throw error;
    }
  },
  async getThreadWithReplies(
    threadId: string,
    page: number,
    limit: number,
    userId?: string,
    options?: {
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ) {
    try {
      logger.info('[threadService] getThreadWithReplies started', {
        threadId,
        page,
        limit,
        userId,
        ...options,
      });
      const result = await threadDAO.getThreadWithReplies(threadId, page, limit, userId, options);
      logger.info('[threadService] getThreadWithReplies success', { found: !!result });
      return result;
    } catch (error) {
      logger.error('[threadService] getThreadWithReplies error', {
        error: error instanceof Error ? error.message : error,
        threadId,
        page,
        limit,
        userId,
        ...options,
      });
      throw error;
    }
  },
  async createReply(parentId: string, content: string, userId: string) {
    try {
      logger.info('[threadService] createReply started', { parentId, userId });
      const result = await threadDAO.createReply(parentId, content, userId);
      logger.info('[threadService] createReply success', { replyId: result.id });
      return result;
    } catch (error) {
      logger.error('[threadService] createReply error', {
        error: error instanceof Error ? error.message : error,
        parentId,
        userId,
      });
      throw error;
    }
  },

  async acceptAnswer(threadId: string, replyId: string) {
    try {
      logger.info('[threadService] acceptAnswer started', { threadId, replyId });
      const result = await threadDAO.acceptAnswer(threadId, replyId);
      logger.info('[threadService] acceptAnswer success', { threadId, replyId, updated: !!result });
      return result;
    } catch (error) {
      logger.error('[threadService] acceptAnswer error', {
        error: error instanceof Error ? error.message : error,
        threadId,
        replyId,
      });
      throw error;
    }
  },
};
