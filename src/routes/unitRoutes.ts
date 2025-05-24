import { UnitController } from '@controllers/unitController';

import { Router } from 'express';

const unitController = new UnitController();
export const unitRouter = Router();

unitRouter.post('/', unitController.create);
unitRouter.get('/', unitController.getAll);
unitRouter.get('/:unitId', unitController.get);
unitRouter.put('/:unitId', unitController.update);
unitRouter.delete('/:unitId', unitController.delete);
