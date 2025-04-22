import { Router } from 'express';
import { SectionController } from '@controllers/sectionController';

const sectionController = new SectionController();
export const sectionRouter = Router();

sectionRouter.post('/', sectionController.createSection);
sectionRouter.get('/', sectionController.getSections);
sectionRouter.get('/:id', sectionController.getSectionById);
sectionRouter.put('/:id', sectionController.updateSection);
sectionRouter.delete('/:id', sectionController.deleteSection);
