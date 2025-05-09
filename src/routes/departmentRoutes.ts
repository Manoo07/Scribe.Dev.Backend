import { DepartmentController } from '@controllers/departmentController';
import { Router } from 'express';

const departmentController = new DepartmentController();
export const departmentRouter = Router();

departmentRouter.post('/', departmentController.createDepartment);
departmentRouter.get('/', departmentController.getDepartmentsByFilter);
departmentRouter.get('/:id', departmentController.getDepartmentById);
departmentRouter.put('/:id', departmentController.updateDepartment);
departmentRouter.delete('/:id', departmentController.deleteDepartment);