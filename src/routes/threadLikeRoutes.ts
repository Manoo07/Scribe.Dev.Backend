import { ThreadLikeController } from '../controllers/threadLikeController';
import { Router } from 'express';

const threadLikeController = new ThreadLikeController();
export const threadLikeRouter = Router();

threadLikeRouter.post('/', threadLikeController.createThreadLike);
threadLikeRouter.get('/', threadLikeController.getAllThreadLikes);
threadLikeRouter.get('/:id', threadLikeController.getThreadLikeById);
threadLikeRouter.put('/:id', threadLikeController.updateThreadLike);
threadLikeRouter.delete('/:id', threadLikeController.deleteThreadLike);
