import { UnitController } from '@controllers/unitController';
import { Router } from 'express';

const unitController = new UnitController();
export const unitRouter = Router();

unitRouter.post('/', unitController.createUnit);
unitRouter.get('/', unitController.getUnits);
unitRouter.get('/:id', unitController.getUnitById);
unitRouter.put('/:id', unitController.updateUnit);
unitRouter.delete('/:id', unitController.deleteUnit);
