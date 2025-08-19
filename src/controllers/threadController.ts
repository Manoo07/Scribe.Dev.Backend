import {
  HTTP_STATUS_OK,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_NO_CONTENT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR
} from '../constants/constants';
import threadService from '../services/threadService';
import { logger } from '../services/logService';
import { Request, Response } from 'express';

export class ThreadController {
  public createThread = async (req: Request, res: Response): Promise<void> => {
    logger.info('[ThreadController] Creating thread', req.body);
    try {
      const result = await threadService.createThread(req.body);
      if (result.error) {
        logger.warn('[ThreadController] Thread creation failed:', result.error);
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: result.error });
        return;
      }
      logger.info('[ThreadController] Thread created:', result.thread);
      res.status(HTTP_STATUS_CREATED).json(result.thread);
    } catch (error) {
      logger.error('[ThreadController] Error creating thread:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public getThreadById = async (req: Request, res: Response): Promise<void> => {
    logger.info(`[ThreadController] Fetching thread by ID: ${req.params.id}`);
    try {
      const thread = await threadService.getThreadById(req.params.id);
      if (!thread) {
        logger.warn('[ThreadController] Thread not found:', req.params.id);
        res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Thread not found' });
        return;
      }
      logger.info('[ThreadController] Thread fetched:', thread);
      res.status(HTTP_STATUS_OK).json(thread);
    } catch (error) {
      logger.error('[ThreadController] Error fetching thread:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public getAllThreads = async (_req: Request, res: Response): Promise<void> => {
    logger.info('[ThreadController] Fetching all threads');
    try {
      const result = await threadService.getAllThreads();
      if (result.error) {
        logger.error('[ThreadController] Error fetching threads:', result.error);
        res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: result.error });
        return;
      }
      const threads = result.threads ?? [];
      logger.info(`[ThreadController] Fetched ${threads.length} threads`);
      res.status(HTTP_STATUS_OK).json(threads);
    } catch (error) {
      logger.error('[ThreadController] Error fetching threads:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public updateThread = async (req: Request, res: Response): Promise<void> => {
    logger.info(`[ThreadController] Updating thread ID: ${req.params.id}`, req.body);
    try {
      const result = await threadService.updateThread(req.params.id, req.body);
      if (result.error) {
        logger.error('[ThreadController] Error updating thread:', result.error);
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: result.error });
        return;
      }
      logger.info('[ThreadController] Thread updated:', result.thread);
      res.status(HTTP_STATUS_OK).json(result.thread);
    } catch (error) {
      logger.error('[ThreadController] Error updating thread:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public deleteThread = async (req: Request, res: Response): Promise<void> => {
    logger.info(`[ThreadController] Deleting thread ID: ${req.params.id}`);
    try {
      const result = await threadService.deleteThread(req.params.id);
      if (result.error) {
        logger.error('[ThreadController] Error deleting thread:', result.error);
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: result.error });
        return;
      }
      logger.info('[ThreadController] Thread deleted:', req.params.id);
      res.status(HTTP_STATUS_NO_CONTENT).send();
    } catch (error) {
      logger.error('[ThreadController] Error deleting thread:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };
}