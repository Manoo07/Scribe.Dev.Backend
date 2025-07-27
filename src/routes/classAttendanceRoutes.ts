// Routes for class attendance
import { Router } from 'express';
import {
  createAttendance,
  deleteAttendance,
  getAttendance,
  updateAttendance,
} from '../controllers/classAttendanceController';

const router = Router();

// Wrap async controllers to handle errors
function asyncHandler(fn: any) {
  return function (req: any, res: any, next: any) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.post('/', asyncHandler(createAttendance));
router.get('/:id', asyncHandler(getAttendance));
router.put('/:id', asyncHandler(updateAttendance));
router.delete('/:id', asyncHandler(deleteAttendance));

export default router;
