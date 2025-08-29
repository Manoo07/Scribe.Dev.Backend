import { PrismaClient, ThreadStatus } from '@prisma/client';
import { logger } from '@services/logService';

const prisma = new PrismaClient();

export const threadDAO = {
  async deleteThreadOrComment(threadId: string, userId: string) {
    // Only allow delete if user is the owner
    const thread = await prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) throw new Error('Thread or comment not found');
    if (thread.userId !== userId) throw new Error('Forbidden: Not the owner');
    // Cascade delete handled by Prisma schema
    await prisma.thread.delete({ where: { id: threadId } });
    return { deleted: true };
  },

  async updateThreadOrComment(threadId: string, userId: string, data: { title?: string; content?: string }) {
    // Only allow update if user is the owner
    const thread = await prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) throw new Error('Thread or comment not found');
    if (thread.userId !== userId) throw new Error('Forbidden: Not the owner');
    // Only update allowed fields
    const updateData: any = {};
    if (typeof data.title === 'string') updateData.title = data.title;
    if (typeof data.content === 'string') updateData.content = data.content;
    if (Object.keys(updateData).length === 0) throw new Error('No valid fields to update');
    const updated = await prisma.thread.update({ where: { id: threadId }, data: updateData });
    return updated;
  },
  async getThreadById(threadId: string) {
    // Used for ownership validation in acceptAnswer
    return await prisma.thread.findUnique({ where: { id: threadId } });
  },
  async createThread(data: any) {
    const { title, content, classroomId, unitId, userId } = data;
    try {
      logger.info('[threadDAO] createThread started', { userId, classroomId, unitId });
      const thread = await prisma.thread.create({
        data: {
          title,
          content,
          classroomId,
          unitId: unitId || undefined,
          userId,
          threadStatus: ThreadStatus.UNANSWERED,
        },
        include: {
          user: true,
          replies: true,
          likes: true,
        },
      });
      logger.info('[threadDAO] createThread success', { threadId: thread.id });
      return {
        id: thread.id,
        title: thread.title,
        content: thread.content,
        user: thread.user ? { id: thread.user.id, name: thread.user.firstName + ' ' + thread.user.lastName } : null,
        threadStatus: thread.threadStatus,
        createdAt: thread.createdAt,
        acceptedAnswerId: thread.acceptedAnswerId,
        repliesCount: thread.replies.length,
        likesCount: thread.likes.filter((like) => like.isLiked).length,
      };
    } catch (error) {
      logger.error('[threadDAO] createThread error', {
        error: error instanceof Error ? error.message : error,
        userId,
        classroomId,
        unitId,
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
      filters?: Record<string, any>;
      userId: string;
    },
  ) {
    try {
      logger.info('[threadDAO] getThreads started', { page, limit, ...options });
      const skip = (page - 1) * limit;
      // Always filter for main threads
      const where: any = { parentId: null };
      // Classroom filter
      if (options.filters && options.filters.classroomId) {
        where.classroomId = options.filters.classroomId;
      }
      // Unit filter
      if (options.filters && options.filters.unitId) {
        if (options.filters.unitId === 'none') {
          where.unitId = null;
        } else {
          where.unitId = options.filters.unitId;
        }
      }

      // Default sort
      let orderBy: any = { createdAt: 'desc' };
      if (options.sortBy) {
        if (['createdAt', 'updatedAt'].includes(options.sortBy)) {
          orderBy = { [options.sortBy]: options.sortOrder || 'desc' };
        } else if (options.sortBy === 'repliesCount') {
          orderBy = [{ replies: { _count: options.sortOrder || 'desc' } }];
        } else if (options.sortBy === 'likesCount') {
          orderBy = [{ likes: { _count: options.sortOrder || 'desc' } }];
        }
      }

      const [threads, total] = await Promise.all([
        prisma.thread.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            user: true,
            replies: true,
            likes: true,
          },
        }),
        prisma.thread.count({ where }),
      ]);
      logger.info('[threadDAO] getThreads success', { count: threads.length });
      return {
        threads: threads.map((thread) => ({
          id: thread.id,
          title: thread.title,
          content: thread.content,
          user: thread.user ? { id: thread.user.id, name: thread.user.firstName + ' ' + thread.user.lastName } : null,
          threadStatus: thread.threadStatus,
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
          repliesCount: thread.replies.length,
          likesCount: thread.likes.filter((like) => like.isLiked).length,
          isLikedByMe: thread.likes.some((like) => like.userId === options.userId && like.isLiked),
        })),
        pagination: {
          total,
          page,
          limit,
          hasNext: skip + threads.length < total,
        },
      };
    } catch (error) {
      logger.error('[threadDAO] getThreads error', {
        error: error instanceof Error ? error.message : error,
        page,
        limit,
        ...options,
      });
      throw error;
    }
  },
  async getThreadWithReplies(threadId: string, page: number, limit: number, userId?: string) {
    try {
      logger.info('[threadDAO] getThreadWithReplies started', { threadId, page, limit });
      // Fetch main thread
      const thread = await prisma.thread.findUnique({
        where: { id: threadId, parentId: null },
        include: {
          user: true,
          likes: true,
        },
      });
      if (!thread) return null;

      // Fetch paginated replies
      const skip = (page - 1) * limit;
      const [replies, total] = await Promise.all([
        prisma.thread.findMany({
          where: { parentId: threadId },
          skip,
          take: limit,
          orderBy: { createdAt: 'asc' },
          include: {
            user: true,
            likes: true,
          },
        }),
        prisma.thread.count({ where: { parentId: threadId } }),
      ]);

      // Get userId from arguments if passed (threadDAO.getThreadWithReplies(threadId, page, limit, userId))
      // This is a hack since the method signature doesn't have userId, but we can add it if needed
      // For now, try to get from arguments[3]
      const userId = arguments[3];

      logger.info('[threadDAO] getThreadWithReplies success', { threadId, repliesCount: replies.length });
      return {
        id: thread.id,
        title: thread.title,
        content: thread.content,
        user: thread.user ? { id: thread.user.id, name: thread.user.firstName + ' ' + thread.user.lastName } : null,
        threadStatus: thread.threadStatus,
        createdAt: thread.createdAt,
        acceptedAnswerId: thread.acceptedAnswerId,
        likesCount: thread.likes.filter((like) => like.isLiked).length,
        isLikedByMe: userId ? thread.likes.some((like) => like.userId === userId && like.isLiked) : false,
        replies: {
          data: replies.map((reply) => ({
            id: reply.id,
            content: reply.content,
            user: reply.user ? { id: reply.user.id, name: reply.user.firstName + ' ' + reply.user.lastName } : null,
            createdAt: reply.createdAt,
            likesCount: reply.likes.filter((like) => like.isLiked).length,
            isAccepted: thread.acceptedAnswerId === reply.id,
            isLikedByMe: userId ? reply.likes.some((like) => like.userId === userId && like.isLiked) : false,
          })),
          pagination: {
            total,
            page,
            limit,
            hasNext: skip + replies.length < total,
          },
        },
      };
    } catch (error) {
      logger.error('[threadDAO] getThreadWithReplies error', {
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
      logger.info('[threadDAO] createReply started', { parentId, userId });
      const reply = await prisma.thread.create({
        data: {
          content,
          parentId,
          userId,
          threadStatus: ThreadStatus.UNANSWERED,
        },
        include: {
          user: true,
          likes: true,
        },
      });
      logger.info('[threadDAO] createReply success', { replyId: reply.id });
      return {
        id: reply.id,
        content: reply.content,
        user: reply.user ? { id: reply.user.id, name: reply.user.firstName + ' ' + reply.user.lastName } : null,
        createdAt: reply.createdAt,
        likesCount: reply.likes.filter((like) => like.isLiked).length,
        isAccepted: false,
      };
    } catch (error) {
      logger.error('[threadDAO] createReply error', {
        error: error instanceof Error ? error.message : error,
        parentId,
        userId,
      });
      throw error;
    }
  },

  async acceptAnswer(threadId: string, replyId: string) {
    try {
      logger.info('[threadDAO] acceptAnswer started', { threadId, replyId });

      // Validate UUID format for both threadId and replyId
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidV4Regex.test(threadId)) {
        throw new Error('Invalid threadId format. Must be a valid UUID.');
      }
      if (!uuidV4Regex.test(replyId)) {
        throw new Error('Invalid replyId format. Must be a valid UUID.');
      }

      // Only allow for main threads (parentId must be null)
      const mainThread = await prisma.thread.findUnique({ where: { id: threadId } });
      if (!mainThread || mainThread.parentId !== null) {
        logger.warn('[threadDAO] acceptAnswer failed: not a main thread', { threadId });
        return null;
      }
      let newAcceptedAnswerId: string | null = replyId;
      let newStatus: ThreadStatus = ThreadStatus.RESOLVED;
      // If already accepted, toggle to null
      if (mainThread.acceptedAnswerId === replyId) {
        newAcceptedAnswerId = null;
        newStatus = ThreadStatus.UNANSWERED;
      }
      const updated = await prisma.thread.update({
        where: { id: threadId },
        data: { acceptedAnswerId: newAcceptedAnswerId, threadStatus: newStatus },
      });
      logger.info(
        `[threadDAO] acceptAnswer success, threadId=${threadId}, replyId=${replyId}, toggled=${mainThread.acceptedAnswerId === replyId}`,
      );
      return updated;
    } catch (error) {
      logger.error('[threadDAO] acceptAnswer error', {
        error: error instanceof Error ? error.message : error,
        threadId,
        replyId,
      });
      throw error;
    }
  },
};
