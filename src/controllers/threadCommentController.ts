import ThreadCommentService from '../services/threadCommentService';
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

  public createThreadComment = async (req: Request, res: Response): Promise<void> => {
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
    try {
      const result = await this.threadCommentService.createThreadComment(req.body);
      if (result.error) {
        logger.warn('[ThreadCommentController] Thread comment creation failed:', result.error);
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: result.error });
        return;
      }
      logger.info('[ThreadCommentController] Thread comment created:', result.comment);
      res.status(HTTP_STATUS_CREATED).json(result.comment);
    } catch (error) {
      logger.error('[ThreadCommentController] Error creating thread comment:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public getThreadCommentById = async (req: Request, res: Response): Promise<void> => {
    logger.info(`[ThreadCommentController] Fetching thread comment by ID: ${req.params.id}`);
    try {
      const comment = await this.threadCommentService.getThreadCommentById(req.params.id);
      if (!comment) {
        logger.warn('[ThreadCommentController] Thread comment not found:', req.params.id);
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

  public getAllThreadComments = async (_req: Request, res: Response): Promise<void> => {
    logger.info('[ThreadCommentController] Fetching all thread comments');
    try {
      const comments = await this.threadCommentService.getAllThreadComments();
      logger.info(`[ThreadCommentController] Fetched ${comments.length} thread comments`);
      res.status(HTTP_STATUS_OK).json(comments);
    } catch (error) {
      logger.error('[ThreadCommentController] Error fetching thread comments:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public updateThreadComment = async (req: Request, res: Response): Promise<void> => {
    logger.info(`[ThreadCommentController] Updating thread comment ID: ${req.params.id}`, req.body);
    try {
      const result = await this.threadCommentService.updateThreadComment(req.params.id, req.body);
      if (result.forbidden) {
        logger.warn('[ThreadCommentController] Forbidden update attempt by user:', req.body.userId);
        res.status(HTTP_STATUS_FORBIDDEN).json({ error: result.error });
        return;
      }
      if (result.error) {
        logger.warn('[ThreadCommentController] Thread comment update failed:', result.error);
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: result.error });
        return;
      }
      logger.info('[ThreadCommentController] Thread comment updated:', result.comment);
      res.status(HTTP_STATUS_OK).json(result.comment);
    } catch (error) {
      logger.error('[ThreadCommentController] Error updating thread comment:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public deleteThreadComment = async (req: Request, res: Response): Promise<void> => {
    logger.info(`[ThreadCommentController] Deleting thread comment ID: ${req.params.id}`);
    try {
      const result = await this.threadCommentService.deleteThreadComment(req.params.id);
      logger.info('[ThreadCommentController] Thread comment deleted:', req.params.id);
      res.status(HTTP_STATUS_NO_CONTENT).send();
    } catch (error) {
      logger.error('[ThreadCommentController] Error deleting thread comment:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };
}
