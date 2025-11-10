import { Router } from 'express';
import * as AssignmentController from '@controllers/assignmentController';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = Router();

function asyncHandler(fn: any) {
	return function (req: any, res: any, next: any) {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}

// Faculty routes
router.post('/', upload.single('questionFile'), asyncHandler(AssignmentController.createAssignment));
// Update assignment (faculty) - allow multipart/form-data with optional questionFile
router.put('/:assignmentId', upload.single('questionFile'), asyncHandler(AssignmentController.updateAssignment));
router.get('/', asyncHandler(AssignmentController.getAssignments));
router.get('/:assignmentId/submissions', asyncHandler(AssignmentController.getSubmissions));
router.patch('/submissions/:submissionId/review', asyncHandler(AssignmentController.reviewSubmission));
router.delete('/:assignmentId', asyncHandler(AssignmentController.deleteAssignment));
// Student routes
router.post('/:assignmentId/submit', upload.single('submissionFile'), asyncHandler(AssignmentController.submitAssignment));
// Fetch the authenticated student's submissions for a specific assignment
router.get('/my', asyncHandler(AssignmentController.getMyAssignment));
// Allow multipart/form-data with an optional 'submissionFile' for updates
router.patch('/submissions/:submissionId', upload.single('submissionFile'), asyncHandler(AssignmentController.updateSubmissionHandler));
router.get('/submissions/my', asyncHandler(AssignmentController.getMySubmissions));
router.delete('/submissions/:submissionId', asyncHandler(AssignmentController.deleteSubmissionHandler));

export const assignmentRouter = router;
export default router;

