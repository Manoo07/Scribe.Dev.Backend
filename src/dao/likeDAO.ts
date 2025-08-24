import { PrismaClient } from '@prisma/client';
import { logger } from '@services/logService';

const prisma = new PrismaClient();

export const likeDAO = {
  async toggleLike({ threadId, replyId, userId }: { threadId?: string; replyId?: string; userId: string }) {
    try {
      logger.info('[likeDAO] toggleLike started', { threadId, replyId, userId });
      const id = threadId || replyId;
      if (!id) throw new Error('threadId or replyId required');
      let like = await prisma.threadLike.findUnique({ where: { threadId_userId: { threadId: id, userId } } });
      if (!like) {
        // Create new like
        like = await prisma.threadLike.create({ data: { threadId: id, userId, isLiked: true } });
        logger.info('[likeDAO] toggleLike created', { id: like.id });
        return { ...like, liked: true };
      } else {
        // Toggle isLiked
        const updated = await prisma.threadLike.update({
          where: { threadId_userId: { threadId: id, userId } },
          data: { isLiked: !like.isLiked },
        });
        logger.info('[likeDAO] toggleLike updated', { id: updated.id, isLiked: updated.isLiked });
        return { ...updated, liked: updated.isLiked };
      }
    } catch (error) {
      logger.error('[likeDAO] toggleLike error', {
        error: error instanceof Error ? error.message : error,
        threadId,
        replyId,
        userId,
      });
      throw error;
    }
  },

  async findLike({ threadId, userId }: { threadId: string; userId: string }) {
    return prisma.threadLike.findUnique({ where: { threadId_userId: { threadId, userId } } });
  },

  async deleteLike({ threadId, userId }: { threadId: string; userId: string }) {
    return prisma.threadLike.delete({ where: { threadId_userId: { threadId, userId } } });
  },
};
