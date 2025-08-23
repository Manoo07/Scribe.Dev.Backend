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
  public create = async (req: Request, res: Response): Promise<void> => {
    logger.info('[ThreadController] Creating thread', req.body);
    const { unitId } = req.body;
    if (!unitId) {
      logger.warn('[ThreadController] unitId is required');
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'unitId is required' });
      return;
    }
    // Validate unit existence
    try {
      const unitDAO = (await import('../dao/unitDAO')).default;
      const unit = await unitDAO.get(unitId);
      if (!unit) {
        logger.warn('[ThreadController] Invalid unitId: Unit does not exist');
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Invalid unitId: Unit does not exist' });
        return;
      }
      const creationResult = await threadService.create(req.body);
      if (creationResult.error) {
        logger.warn('[ThreadController] Thread creation failed:', creationResult.error);
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: creationResult.error });
        return;
      }
      logger.info('[ThreadController] Thread created:', creationResult.thread);
      res.status(HTTP_STATUS_CREATED).json(creationResult.thread);
    } catch (error) {
      logger.error('[ThreadController] Error creating thread:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public get = async (req: Request, res: Response): Promise<void> => {
    const threadId = req.params.id;
    logger.info(`[ThreadController] Fetching thread by ID: ${threadId}`);
    try {
      const thread = await threadService.get(threadId);
      if (!thread) {
        logger.warn('[ThreadController] Thread not found:', threadId);
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

  public getAll = async (req: Request, res: Response): Promise<void> => {
    logger.info('[ThreadController] Fetching all threads');
    // Pagination
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    try {
      const allThreads = await threadService.getAll({ pageSize, pageNumber });
      if (allThreads.error) {
        logger.error('[ThreadController] Error fetching threads:', allThreads.error);
        res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: allThreads.error });
        return;
      }
      const threads = allThreads.threads ?? [];
      logger.info(`[ThreadController] Fetched ${threads.length} threads`);
      res.status(HTTP_STATUS_OK).json(threads);
    } catch (error) {
      logger.error('[ThreadController] Error fetching threads:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    const threadId = req.params.id;
    logger.info(`[ThreadController] Updating thread ID: ${threadId}`, req.body);
    try {
      const updateResult = await threadService.update(threadId, req.body);
      if (updateResult.error) {
        logger.error('[ThreadController] Error updating thread:', updateResult.error);
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: updateResult.error });
        return;
      }
      logger.info('[ThreadController] Thread updated:', updateResult.thread);
      res.status(HTTP_STATUS_OK).json(updateResult.thread);
    } catch (error) {
      logger.error('[ThreadController] Error updating thread:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    const threadId = req.params.id;
    logger.info(`[ThreadController] Deleting thread ID: ${threadId}`);
    try {
      const deletionResult = await threadService.delete(threadId);
      if (deletionResult.error) {
        logger.error('[ThreadController] Error deleting thread:', deletionResult.error);
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: deletionResult.error });
        return;
      }
      logger.info('[ThreadController] Thread deleted:', threadId);
      res.status(HTTP_STATUS_NO_CONTENT).send();
    } catch (error) {
      logger.error('[ThreadController] Error deleting thread:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };
}