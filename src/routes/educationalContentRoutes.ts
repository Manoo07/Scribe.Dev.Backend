import { Router } from 'express';
import { EducationalContentController } from '../controllers/educationalContentController';

const educationalContentController = new EducationalContentController();
export const educationalContentRouter = Router();
educationalContentRouter.post('/:unitId', educationalContentController.createEducationalContent);
educationalContentRouter.get('/:unitId', educationalContentController.getEducationalContentByUnitId);
educationalContentRouter.put('/:id', educationalContentController.updateEducationalContent);
educationalContentRouter.delete('/:id', educationalContentController.deleteEducationalContent);
