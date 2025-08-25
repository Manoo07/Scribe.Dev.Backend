import { threadDAO } from '@dao/threadDAO';
import { ThreadStatus } from '@prisma/client';
import { logger } from '@services/logService';
export const threadService = {
  async likeThreadOrReply({ threadId, replyId, userId }: { threadId?: string; replyId?: string; userId: string }) {
    try {
      logger.info('[threadService] likeThreadOrReply started', { threadId, replyId, userId });
      const { likeDAO } = await import('@dao/likeDAO');
      const id = threadId || replyId;
      if (!id) throw new Error('threadId or replyId required');
      // Toggle like: if exists, delete (unlike), else create (like)
  const likeToggleResult = await likeDAO.toggleLike({ threadId, replyId, userId });
  logger.info('[threadService] likeThreadOrReply toggled', { threadId: id, userId, liked: likeToggleResult.liked });
  return likeToggleResult;
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
  const createdThread = await threadDAO.createThread({ ...data, userId });
  logger.info('[threadService] createThread success', { threadId: createdThread.id });
  return createdThread;
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
    } = {},
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
      const threadsData = await threadDAO.getThreads(page, limit, {
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
        filters,
      });
      logger.info('[threadService] getThreads success', { count: threadsData.threads.length });
      return threadsData;
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
  async getThreadWithReplies(threadId: string, page: number, limit: number) {
    try {
      logger.info('[threadService] getThreadWithReplies started', { threadId, page, limit });
  const threadWithReplies = await threadDAO.getThreadWithReplies(threadId, page, limit);
  logger.info('[threadService] getThreadWithReplies success', { found: !!threadWithReplies });
  return threadWithReplies;
    } catch (error) {
      logger.error('[threadService] getThreadWithReplies error', {
        error: error instanceof Error ? error.message : error,
        threadId,
        page,
        limit,
      });
      throw error;
    }
  },
  async createReply(parentId: string, content: string, userId: string) {
    try {
      logger.info('[threadService] createReply started', { parentId, userId });
  const createdReply = await threadDAO.createReply(parentId, content, userId);
  logger.info('[threadService] createReply success', { replyId: createdReply.id });
  return createdReply;
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
  const acceptAnswerResult = await threadDAO.acceptAnswer(threadId, replyId);
  logger.info('[threadService] acceptAnswer success', { threadId, replyId, updated: !!acceptAnswerResult });
  return acceptAnswerResult;
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
