import { ThreadController } from '../controllers/threadController';
import { Router } from 'express';

const threadController = new ThreadController();
export const threadRouter = Router();

threadRouter.post('/', threadController.create);
threadRouter.get('/', threadController.getAll);
threadRouter.get('/:id', threadController.get);
threadRouter.put('/:id', threadController.update);
threadRouter.delete('/:id', threadController.delete);
