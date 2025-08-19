import ThreadLikeService from '../services/threadLikeService';
import ThreadCommentService from '../services/threadCommentService';
import { Request, Response } from 'express';
import { logger } from '../services/logService';
import {
  HTTP_STATUS_OK,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_NO_CONTENT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_BAD_REQUEST
} from '../constants/constants';

export class ThreadLikeController {
  private threadLikeService = new ThreadLikeService();

  public createThreadLike = async (req: Request, res: Response): Promise<void> => {
    logger.info('[ThreadLikeController] Creating thread like', req.body);
    const { userId, threadCommentId } = req.body;
    if (!userId) {
      logger.warn('[ThreadLikeController] userId is required');
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'userId is required' });
      return;
    }
    if (!threadCommentId) {
      logger.warn('[ThreadLikeController] threadCommentId is required');
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'threadCommentId is required' });
      return;
    }
    try {
      // Check if thread comment exists before creating like
      const threadCommentService = new ThreadCommentService();
      const comment = await threadCommentService.getThreadCommentById(threadCommentId);
      if (!comment) {
        logger.warn('[ThreadLikeController] Thread comment not found for threadCommentId:', threadCommentId);
        res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Thread comment not found' });
        return;
      }
      const result = await this.threadLikeService.createThreadLike(req.body);
      logger.info('[ThreadLikeController] Thread like created:', result.like);
      res.status(HTTP_STATUS_CREATED).json(result.like);
    } catch (error) {
      logger.error('[ThreadLikeController] Error creating thread like:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public getThreadLikeById = async (req: Request, res: Response): Promise<void> => {
    logger.info(`[ThreadLikeController] Fetching thread like by ID: ${req.params.id}`);
    try {
      const like = await this.threadLikeService.getThreadLikeById(req.params.id);
      if (!like) {
        logger.warn('[ThreadLikeController] Thread like not found:', req.params.id);
        res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Like not found' });
        return;
      }
      logger.info('[ThreadLikeController] Thread like fetched:', like);
      res.status(HTTP_STATUS_OK).json(like);
    } catch (error) {
      logger.error('[ThreadLikeController] Error fetching thread like:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public getAllThreadLikes = async (_req: Request, res: Response): Promise<void> => {
    logger.info('[ThreadLikeController] Fetching all thread likes');
    try {
      const likes = await this.threadLikeService.getAllThreadLikes();
      logger.info(`[ThreadLikeController] Fetched ${likes.length} thread likes`);
      res.status(HTTP_STATUS_OK).json(likes);
    } catch (error) {
      logger.error('[ThreadLikeController] Error fetching thread likes:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public updateThreadLike = async (req: Request, res: Response): Promise<void> => {
    logger.info(`[ThreadLikeController] Updating thread like ID: ${req.params.id}`, req.body);
    const { userId, threadCommentId } = req.body;
    if (!userId && !threadCommentId) {
      logger.warn('[ThreadLikeController] At least one of userId or threadCommentId is required for update');
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'userId or threadCommentId is required' });
      return;
    }
    if (threadCommentId) {
      // Check if thread comment exists before updating like
      const threadCommentService = new ThreadCommentService();
      const comment = await threadCommentService.getThreadCommentById(threadCommentId);
      if (!comment) {
        logger.warn('[ThreadLikeController] Thread comment not found for threadCommentId:', threadCommentId);
        res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Thread comment not found' });
        return;
      }
    }
    try {
      const updateData: { userId?: string; threadCommentId?: string } = {};
      if (userId) updateData.userId = userId;
      if (threadCommentId) updateData.threadCommentId = threadCommentId;
      const result = await this.threadLikeService.updateThreadLike(req.params.id, updateData);
      logger.info('[ThreadLikeController] Thread like updated:', result.like);
      res.status(HTTP_STATUS_OK).json(result.like);
    } catch (error) {
      logger.error('[ThreadLikeController] Error updating thread like:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public deleteThreadLike = async (req: Request, res: Response): Promise<void> => {
    logger.info(`[ThreadLikeController] Deleting thread like ID: ${req.params.id}`);
    try {
      const result = await this.threadLikeService.deleteThreadLike(req.params.id);
      logger.info('[ThreadLikeController] Thread like deleted:', req.params.id);
      res.status(HTTP_STATUS_NO_CONTENT).send();
    } catch (error) {
      logger.error('[ThreadLikeController] Error deleting thread like:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };
}
