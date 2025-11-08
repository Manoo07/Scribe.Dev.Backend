import { ThreadStatus } from '@prisma/client';
import { logger } from '@services/logService';
import { isValidUUID } from '@utils/validators';
import prisma from '../prisma/prismaClient';

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
        error: error instanceof Error ? error.message : String(error),
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
      // Clear separation of concerns implementation:
      // 1. Global threads: classroomId = null AND parentId = null
      // 2. Classroom-specific threads: specific classroomId
      if (options.filters && options.filters.classroomId) {
        if (options.filters.classroomId === 'global') {
          // Global threads: only threads with null classroomId and null parentId
          where.classroomId = null;
          where.parentId = null;
          logger.info('[threadDAO] getThreads - applying global threads filter', {
            whereCondition: where,
          });
        } else {
          // Classroom-specific threads: specific classroomId
          where.classroomId = options.filters.classroomId;
          logger.info('[threadDAO] getThreads - applying classroom filter', {
            classroomId: options.filters.classroomId,
            whereCondition: where,
          });
        }
      }

      // Unit filter only applies to global threads or when explicitly requested
      if (options.filters && options.filters.unitId) {
        if (options.filters.unitId === 'none') {
          where.unitId = null;
        } else {
          where.unitId = options.filters.unitId;
        }
      }

      // Status filter (resolved, unanswered, closed)
      if (options.filters && options.filters.status) {
        where.threadStatus = options.filters.status;
      }

      // Author filter
      if (options.filters && options.filters.authorId) {
        where.userId = options.filters.authorId;
      }

      // Date range filters
      if (options.filters && options.filters.dateFrom) {
        where.createdAt = {
          ...where.createdAt,
          gte: new Date(options.filters.dateFrom as string),
        };
      }
      if (options.filters && options.filters.dateTo) {
        where.createdAt = {
          ...where.createdAt,
          lte: new Date(options.filters.dateTo as string),
        };
      }

      // Has replies filter
      if (options.filters && options.filters.hasReplies !== undefined) {
        if (options.filters.hasReplies === true) {
          where.replies = { some: {} };
        } else if (options.filters.hasReplies === false) {
          where.replies = { none: {} };
        }
      }

      // Has likes filter
      if (options.filters && options.filters.hasLikes !== undefined) {
        if (options.filters.hasLikes === true) {
          where.likes = { some: { isLiked: true } };
        } else if (options.filters.hasLikes === false) {
          where.likes = { none: { isLiked: true } };
        }
      }

      // Sorting logic with all options consolidated
      let orderBy: any = { createdAt: 'desc' }; // Default
      switch (options.sortBy) {
        case 'createdAt':
        case 'updatedAt':
          orderBy = { [options.sortBy]: options.sortOrder || 'desc' };
          break;
        case 'repliesCount':
        case 'mostReplied':
          orderBy = [{ replies: { _count: options.sortOrder || 'desc' } }];
          break;
        case 'likesCount':
        case 'mostLiked':
          orderBy = [{ likes: { _count: options.sortOrder || 'desc' } }];
          break;
        case 'title':
        case 'alphabetical':
          orderBy = { title: options.sortOrder || 'asc' };
          break;
        case 'mostRecent':
          orderBy = { updatedAt: 'desc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }

      logger.info('[threadDAO] getThreads - executing query with where clause', {
        where,
        skip,
        limit,
        filterType: options.filters?.classroomId === 'global' ? 'Global Threads' : 'Classroom-Specific Threads',
      });

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
      logger.info('[threadDAO] getThreads success', {
        count: threads.length,
        total,
        filterType: options.filters?.classroomId === 'global' ? 'Global Threads' : 'Classroom-Specific Threads',
      });
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
        error: error instanceof Error ? error.message : String(error),
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
      logger.info('[threadDAO] getThreadWithReplies started', { threadId, page, limit, ...options });

      // Fetch main thread
      const thread = await prisma.thread.findUnique({
        where: { id: threadId, parentId: null },
        include: {
          user: true,
          likes: true,
        },
      });
      if (!thread) return null;

      // Determine sorting for replies
      let orderBy: any = { createdAt: 'asc' }; // Default sorting

      if (options?.sortBy) {
        if (options.sortBy === 'mostRecent') {
          orderBy = { updatedAt: options.sortOrder || 'desc' };
        } else if (options.sortBy === 'mostReplied') {
          // For replies, this would be most liked since replies can't have replies
          orderBy = { likes: { _count: options.sortOrder || 'desc' } };
        } else if (options.sortBy === 'newest') {
          orderBy = { createdAt: options.sortOrder || 'desc' };
        } else if (options.sortBy === 'mostLiked') {
          orderBy = { likes: { _count: options.sortOrder || 'desc' } };
        } else if (options.sortBy === 'alphabetical') {
          // For replies, sort by content since they don't have titles
          orderBy = { content: options.sortOrder || 'asc' };
        } else if (options.sortBy === 'createdAt') {
          orderBy = { createdAt: options.sortOrder || 'desc' };
        } else if (options.sortBy === 'updatedAt') {
          orderBy = { updatedAt: options.sortOrder || 'desc' };
        }
      }

      // Fetch paginated replies with sorting
      const skip = (page - 1) * limit;
      const [replies, total] = await Promise.all([
        prisma.thread.findMany({
          where: { parentId: threadId },
          skip,
          take: limit,
          orderBy,
          include: {
            user: true,
            likes: true,
          },
        }),
        prisma.thread.count({ where: { parentId: threadId } }),
      ]);

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
            user: reply.user ? { id: reply.user.id, name: reply.user.firstName + ' ' + thread.user.lastName } : null,
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
        error: error instanceof Error ? error.message : String(error),
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
        error: error instanceof Error ? error.message : String(error),
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
      if (!isValidUUID(threadId)) {
        throw new Error('Invalid threadId format. Must be a valid UUID.');
      }
      if (!isValidUUID(replyId)) {
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

      // If already accepted, toggle to null (unmark)
      if (mainThread.acceptedAnswerId === replyId) {
        newAcceptedAnswerId = null;
        newStatus = ThreadStatus.UNANSWERED;
      }

      const updated = await prisma.thread.update({
        where: { id: threadId },
        data: { acceptedAnswerId: newAcceptedAnswerId, threadStatus: newStatus },
      });

      logger.info('[threadDAO] acceptAnswer success', {
        threadId,
        replyId,
        action: mainThread.acceptedAnswerId === replyId ? 'unmarked' : 'accepted',
      });

      return updated;
    } catch (error) {
      logger.error('[threadDAO] acceptAnswer error', {
        error: error instanceof Error ? error.message : String(error),
        threadId,
        replyId,
      });
      throw error;
    }
  },
};
