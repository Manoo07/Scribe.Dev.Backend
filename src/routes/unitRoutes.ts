import { UnitController } from '@controllers/unitController';
import { Router } from 'express';

const unitController = new UnitController();
export const unitRouter = Router();

unitRouter.post('/', unitController.createUnit);
// unitRouter.get('/', unitController.getUnits);
unitRouter.get('/', unitController.filterUnits.bind(unitController));
unitRouter.get('/:id', unitController.getUnitByUnitId);
unitRouter.get('/classroom/:classroomId', unitController.getUnitsByClassroomId);
unitRouter.put('/:unitId', unitController.updateUnit);
unitRouter.delete('/:unitId', unitController.deleteUnitByUnitId);
