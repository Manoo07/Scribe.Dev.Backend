import { EducationalContentController } from '@controllers/educationalContentController';
import { Router } from 'express';

const educationalContentController = new EducationalContentController();
export const educationalContentRouter = Router();
educationalContentRouter.post('/:unitId', educationalContentController.create);
educationalContentRouter.get('/', educationalContentController.getAll);
educationalContentRouter.get('/:unitId', educationalContentController.get);
educationalContentRouter.put('/:educationalContentId', educationalContentController.update);
educationalContentRouter.delete('/:educationalContentId', educationalContentController.delete);
