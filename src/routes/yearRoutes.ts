import { YearController } from '@controllers/yearController';
import { Router } from 'express';

const yearController = new YearController();
export const yearRouter = Router();

yearRouter.post('/', yearController.createYear);
yearRouter.get('/', yearController.getYears);
yearRouter.get('/:id', yearController.getYearById);
yearRouter.put('/:id', yearController.updateYear);
yearRouter.delete('/:id', yearController.deleteYear);
