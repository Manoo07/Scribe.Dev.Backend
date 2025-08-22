import { ThreadCommentController } from '../controllers/threadCommentController';
import { Router } from 'express';

const threadCommentController = new ThreadCommentController();
export const threadCommentRouter = Router();

threadCommentRouter.post('/', threadCommentController.create);
threadCommentRouter.get('/', threadCommentController.getAll);
threadCommentRouter.get('/:id', threadCommentController.get);
threadCommentRouter.put('/:id', threadCommentController.update);
threadCommentRouter.delete('/:id', threadCommentController.delete);
