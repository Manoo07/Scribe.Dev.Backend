import { UnitController } from '@controllers/unitController';
import UnitService from '@services/unitService';

import { Router } from 'express';

const unitService = new UnitService();
const unitController = new UnitController(unitService);
export const unitRouter = Router();

unitRouter.post('/', unitController.create);
unitRouter.get('/', unitController.getAll.bind(unitController));
unitRouter.get('/:unitId', unitController.get);
unitRouter.put('/:unitId', unitController.update);
unitRouter.delete('/:unitId', unitController.delete);
