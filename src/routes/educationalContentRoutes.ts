
import { EducationalContentController } from '@controllers/educationalContentController';
import { Router } from 'express';

const educationalContentController = new EducationalContentController();
export const educationalContentRouter = Router();
educationalContentRouter.post('/:unitId', educationalContentController.createEducationalContent);
educationalContentRouter.get('/:unitId', educationalContentController.getEducationalContentByUnitId);
educationalContentRouter.put('/:educationalContentId', educationalContentController.updateEducationalContent);
educationalContentRouter.delete('/:educationalContentId', educationalContentController.deleteEducationalContent);
