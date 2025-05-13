import { Router, Request, Response } from 'express';
import { CollegeController } from '@controllers/collegeController';

export const collegeRouter = Router();
const collegeController = new CollegeController();

collegeRouter.post('/', collegeController.createCollege);
collegeRouter.get('/', collegeController.getColleges);
collegeRouter.put('/:id', collegeController.updateCollege);
collegeRouter.delete('/:id', collegeController.deleteCollege);
