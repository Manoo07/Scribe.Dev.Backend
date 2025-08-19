import { ThreadController } from '../controllers/threadController';
import { Router } from 'express';

const threadController = new ThreadController();
export const threadRouter = Router();

threadRouter.post('/', threadController.createThread);
threadRouter.get('/', threadController.getAllThreads);
threadRouter.get('/:id', threadController.getThreadById);
threadRouter.put('/:id', threadController.updateThread);
threadRouter.delete('/:id', threadController.deleteThread);
