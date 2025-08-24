// Get threads for a unit (with classroom membership restriction)

// Get threads for a unit (with classroom membership restriction)

import { threadController } from '@controllers/threadController';
import { logger } from '@services/logService';
import { Router } from 'express';

const threadRouter = Router();

// Create a thread
threadRouter.post('/', async (req, res) => {
  logger.info('[threadRoutes] POST / - createThread route hit');
  await threadController.createThread(req, res);
});

// Get all threads (paginated)
threadRouter.get('/', async (req, res) => {
  logger.info('[threadRoutes] GET / - getThreads route hit');
  await threadController.getThreads(req, res);
});

// Get threads for a unit (with classroom membership restriction)
threadRouter.get('/unit/:unitId', async (req, res) => {
  logger.info('[threadRoutes] GET /unit/:unitId - getThreadsByUnitWithAccess route hit', { unitId: req.params.unitId });
  await threadController.getThreadsByUnitWithAccess(req, res);
});

// Get main thread with replies (paginated)
threadRouter.get('/:id', async (req, res) => {
  logger.info('[threadRoutes] GET /:id - getThreadWithReplies route hit', { threadId: req.params.id });
  await threadController.getThreadWithReplies(req, res);
});

// Post a reply to a main thread
threadRouter.post('/:id/reply', async (req, res) => {
  logger.info('[threadRoutes] POST /:id/reply - createReply route hit', { threadId: req.params.id });
  await threadController.createReply(req, res);
});

// Accept an answer for a main thread
threadRouter.patch('/:threadId/accept-answer/:replyId', async (req, res) => {
  logger.info('[threadRoutes] PATCH /:threadId/accept-answer/:replyId - acceptAnswer route hit', {
    threadId: req.params.threadId,
    replyId: req.params.replyId,
  });
  await threadController.acceptAnswer(req, res);
});

export { threadRouter };
