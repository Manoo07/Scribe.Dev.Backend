import ThreadCommentService from '../services/threadCommentService';
import userDAO from '../dao/userDAO';
import { Request, Response } from 'express';
import { logger } from '../services/logService';
import {
  HTTP_STATUS_OK,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_NO_CONTENT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_FORBIDDEN
} from '../constants/constants';

export class ThreadCommentController {
  private threadCommentService = new ThreadCommentService();

  public create= async (req: Request, res: Response): Promise<void> => {
    logger.info('[ThreadCommentController] Creating thread comment', req.body);
    const { userId, threadId } = req.body;
    if (!userId) {
      logger.warn('[ThreadCommentController] userId is required');
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'userId is required' });
      return;
    }
    if (!threadId) {
      logger.warn('[ThreadCommentController] threadId is required');
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'threadId is required' });
      return;
    }
    // Validate user existence
    try {
      const user = await userDAO.get({ filter: { id: userId } });
      if (!user) {
        logger.warn('[ThreadCommentController] Invalid userId: User does not exist');
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Invalid userId: User does not exist' });
        return;
      }
      const creationResult = await this.threadCommentService.create(req.body);
      if (creationResult.error) {
        logger.warn('[ThreadCommentController] Thread comment creation failed:', creationResult.error);
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: creationResult.error });
        return;
      }
      logger.info('[ThreadCommentController] Thread comment created:', creationResult.comment);
      res.status(HTTP_STATUS_CREATED).json(creationResult.comment);
    } catch (error) {
      logger.error('[ThreadCommentController] Error creating thread comment:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public get = async (req: Request, res: Response): Promise<void> => {
    const threadCommentId = req.params.id;
    logger.info(`[ThreadCommentController] Fetching thread comment by ID: ${threadCommentId}`);
    try {
      const comment = await this.threadCommentService.get(threadCommentId);
      if (!comment) {
        logger.warn('[ThreadCommentController] Thread comment not found:', threadCommentId);
        res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Comment not found' });
        return;
      }
      logger.info('[ThreadCommentController] Thread comment fetched:', comment);
      res.status(HTTP_STATUS_OK).json(comment);
    } catch (error) {
      logger.error('[ThreadCommentController] Error fetching thread comment:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public getAll = async (_req: Request, res: Response): Promise<void> => {
    logger.info('[ThreadCommentController] Fetching all thread comments');
    try {
      const comments = await this.threadCommentService.getAll();
      logger.info(`[ThreadCommentController] Fetched ${comments.length} thread comments`);
      res.status(HTTP_STATUS_OK).json(comments);
    } catch (error) {
      logger.error('[ThreadCommentController] Error fetching thread comments:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    const threadCommentId = req.params.id;
    logger.info(`[ThreadCommentController] Updating thread comment ID: ${threadCommentId}`, req.body);
    const { userId } = req.body;
    if (!userId) {
      logger.warn('[ThreadCommentController] userId is required');
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'userId is required' });
      return;
    }
    // Validate comment existence and ownership
    try {
      const existingComment = await this.threadCommentService.get(threadCommentId);
      if (!existingComment) {
        logger.warn('[ThreadCommentController] Thread comment not found:', threadCommentId);
        res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Thread comment not found' });
        return;
      }
      if (existingComment.userId !== userId) {
        logger.warn('[ThreadCommentController] Forbidden update attempt by user:', userId);
        res.status(HTTP_STATUS_FORBIDDEN).json({ error: 'You are not allowed to update this comment' });
        return;
      }
      const updateResult = await this.threadCommentService.update(threadCommentId, req.body);
      if (updateResult.error) {
        logger.warn('[ThreadCommentController] Thread comment update failed:', updateResult.error);
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: updateResult.error });
        return;
      }
      logger.info('[ThreadCommentController] Thread comment updated:', updateResult.comment);
      res.status(HTTP_STATUS_OK).json(updateResult.comment);
    } catch (error) {
      logger.error('[ThreadCommentController] Error updating thread comment:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    const threadCommentId = req.params.id;
    logger.info(`[ThreadCommentController] Deleting thread comment ID: ${threadCommentId}`);
    try {
  const deletionResult = await this.threadCommentService.delete(threadCommentId);
  logger.info('[ThreadCommentController] Thread comment deleted:', threadCommentId);
  res.status(HTTP_STATUS_NO_CONTENT).send();
    } catch (error) {
      logger.error('[ThreadCommentController] Error deleting thread comment:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };
}
