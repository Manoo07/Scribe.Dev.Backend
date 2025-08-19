import { ThreadCommentController } from '../controllers/threadCommentController';
import { Router } from 'express';

const threadCommentController = new ThreadCommentController();
export const threadCommentRouter = Router();

threadCommentRouter.post('/', threadCommentController.createThreadComment);
threadCommentRouter.get('/', threadCommentController.getAllThreadComments);
threadCommentRouter.get('/:id', threadCommentController.getThreadCommentById);
threadCommentRouter.put('/:id', threadCommentController.updateThreadComment);
threadCommentRouter.delete('/:id', threadCommentController.deleteThreadComment);
