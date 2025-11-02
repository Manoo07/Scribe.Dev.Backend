import { Request, Response } from 'express';
import AssignmentService from '../services/assignmentService';
import { logger } from '../services/logService';
import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_CREATED, HTTP_STATUS_FORBIDDEN, HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP_STATUS_OK } from '@constants/constants';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// configure cloudinary from env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadBufferToCloudinary(buffer: Buffer, folder = 'scribe') {
  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error: any, result: any) => {
      if (error) return reject(error);
      resolve(result.secure_url);
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

const assignmentService = new AssignmentService();

export const createAssignment = async (req: Request, res: Response): Promise<void> => {
  logger.info('[AssignmentController] Creating assignment');
  try {
    const facultyId = req.user?.id;
    if (!facultyId) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Faculty ID missing from user context' });
      return;
    }
    if (req.user?.role !== 'FACULTY') {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Forbidden: only faculty' });
      return;
    }
    const rawBody = req.body || {};
    const normalizedBody: Record<string, any> = {};
    Object.keys(rawBody).forEach((k) => {
      const trimmed = k.trim();
      normalizedBody[trimmed] = rawBody[k];
    });

    const { title, content, deadline, classroomId, questionFileUrl: questionFileUrlBody, noteContent, description } = normalizedBody;
    // if a file was uploaded via multipart/form-data, multer puts it on req.file
    // (in future this should be the S3/Cloudinary upload result).
    const uploadedFile = (req as any).file as any | undefined;
    let questionFileUrl = questionFileUrlBody;
    if (uploadedFile && uploadedFile.buffer) {
      try {
        const cloudUrl = await uploadBufferToCloudinary(uploadedFile.buffer, `questions/${facultyId || 'anon'}`);
        questionFileUrl = cloudUrl;
      } catch (err) {
        logger.error('[AssignmentController] Cloudinary upload failed:', err);
      }
    }

    // content must be one of the AssignmentContent enum values: 'NOTE' | 'QUESTION_FILE'
    if (!title || !content) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Missing required fields: title or content' });
      return;
    }
    if (content !== 'NOTE' && content !== 'QUESTION_FILE') {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: `Invalid content type: ${content}` });
      return;
    }
    // require at least one of noteContent or questionFileUrl
    if (!noteContent && !questionFileUrl) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Either noteContent or questionFileUrl is required' });
      return;
    }

    if (!deadline) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'deadline is required' });
      return;
    }
    const parsedDeadline = new Date(deadline);
    if (isNaN(parsedDeadline.getTime())) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Invalid deadline format' });
      return;
    }

    const payload = {
      title,
      content,
      deadline: parsedDeadline,
      classroomId,
      questionFileUrl,
      noteContent,
      description,
      facultyId,
    };

    const result = await assignmentService.createAssignment(payload);
    if (result.error) {
      logger.error('[AssignmentController] Error creating assignment:', result.error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: result.error });
      return;
    }
    logger.info('[AssignmentController] Assignment created:', result.assignment);
    res.status(HTTP_STATUS_CREATED).json(result.assignment);
    return;
  } catch (err) {
    logger.error('[AssignmentController] Unexpected error:', (err as Error).message);
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: (err as Error).message });
    return;
  }
};

export const updateAssignment = async (req: Request, res: Response): Promise<void> => {
  logger.info('[AssignmentController] Updating assignment');
  try {
    const facultyId = req.user?.id;
    if (!facultyId) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Faculty ID missing from user context' });
      return;
    }
    if (req.user?.role !== 'FACULTY') {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Forbidden: only faculty' });
      return;
    }
    const { assignmentId } = req.params;
    // normalize body keys
    const rawBody = req.body || {};
    const normalizedBody: Record<string, any> = {};
    Object.keys(rawBody).forEach((k) => { normalizedBody[k.trim()] = rawBody[k]; });

    const { title, content, deadline, classroomId, questionFileUrl: questionFileUrlBody, noteContent, description } = normalizedBody;
    let questionFileUrl = questionFileUrlBody;
    const uploadedFile = (req as any).file as any | undefined;
    if (uploadedFile && uploadedFile.buffer) {
      try {
        questionFileUrl = await uploadBufferToCloudinary(uploadedFile.buffer, `questions/${facultyId || 'anon'}`);
      } catch (err) {
        logger.error('[AssignmentController] Cloudinary upload failed:', err);
      }
    }

    // If the updated content type is NOTE, explicitly clear any question file URL
    // so that previous question files are removed when switching back to a NOTE.
    if (content === 'NOTE') {
      questionFileUrl = null;
    }

    const updatePayload: any = { title, content, deadline: deadline ? new Date(deadline) : undefined, classroomId, questionFileUrl, noteContent, description, facultyId };
    const result = await assignmentService.updateAssignment(assignmentId, facultyId, updatePayload);
    if (result.error) {
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: result.error });
      return;
    }
    res.json(result.assignment);
    return;
  } catch (err) {
    logger.error('[AssignmentController] Unexpected error:', (err as Error).message);
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: (err as Error).message });
    return;
  }
};

export const getAssignments = async (req: Request, res: Response): Promise<void> => {
  logger.info('[AssignmentController] Fetching assignments');
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'User ID missing from user context' });
      return;
    }
    const filter = req.query || {};
    if (req.user?.role === 'FACULTY') {
      const assignments = await assignmentService.getAssignmentsByFaculty(userId, filter as any);
      logger.info('[AssignmentController] Fetched assignments:', assignments.length);
      res.json(assignments);
      return;
    }
    if (req.user?.role === 'STUDENT') {
      const assignments = await assignmentService.getAssignmentsForStudent(userId, filter as any);
      res.json(assignments);
      return;
    }
    res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Forbidden' });
    return;
  } catch (err) {
    logger.error('[AssignmentController] Unexpected error:', (err as Error).message);
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: (err as Error).message });
    return;
  }
};

export const getMyAssignment = async (req: Request, res: Response): Promise<void> => {
  logger.info('[AssignmentController] Fetching my assignment submissions');
  try {
    const studentUserId = req.user?.id;
    if (!studentUserId) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Student ID missing' });
      return;
    }
    const assignmentId = req.query.assignmentId as string | undefined;
    if (!assignmentId) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'assignmentId required' });
      return;
    }
    const submissions = await assignmentService.getSubmissionsForStudentAssignment(studentUserId, assignmentId);
    res.json(submissions);
    return;
  } catch (err) {
    logger.error('[AssignmentController] Unexpected error:', (err as Error).message);
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: (err as Error).message });
    return;
  }
};

export const getSubmissions = async (req: Request, res: Response): Promise<void> => {
  logger.info('[AssignmentController] Fetching submissions');
  try {
  const assignmentId = req.params.assignmentId;
  const filter: any = {};
  if (req.query.status) filter.status = req.query.status;
  const submissions = await assignmentService.getSubmissions(assignmentId, filter);
  logger.info('[AssignmentController] Fetched submissions:', submissions.length);
  res.json(submissions);
  return;
  } catch (err) {
    logger.error('[AssignmentController] Unexpected error:', (err as Error).message);
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: (err as Error).message });
    return;
  }
};

export const reviewSubmission = async (req: Request, res: Response): Promise<void> => {
  logger.info('[AssignmentController] Reviewing submission');
  try {
    const submissionId = req.params.submissionId;
    const { status, facultyComment } = req.body;
    const review = { status, facultyComment };
    const result = await assignmentService.reviewSubmission(submissionId, review);
    if (result.error) {
      logger.error('[AssignmentController] Error reviewing submission:', result.error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: result.error });
      return;
    }
    logger.info('[AssignmentController] Submission reviewed:', result.updated);
    res.json(result.updated);
    return;
  } catch (err) {
    logger.error('[AssignmentController] Unexpected error:', (err as Error).message);
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: (err as Error).message });
    return;
  }
};

export const deleteAssignment = async (req: Request, res: Response): Promise<void> => {
  logger.info('[AssignmentController] Deleting assignment');
  try {
    const facultyId = req.user?.id;
    if (!facultyId) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Faculty ID missing from user context' });
      return;
    }
    if (req.user?.role !== 'FACULTY') {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Forbidden: only faculty' });
      return;
    }
    const { assignmentId } = req.params;
    const result = await assignmentService.deleteAssignment(assignmentId, facultyId);
    if (result.error) {
      logger.error('[AssignmentController] Error deleting assignment:', result.error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: result.error });
      return;
    }
    logger.info('[AssignmentController] Assignment deleted');
    res.status(HTTP_STATUS_OK).json({ success: true });
    return;
  } catch (err) {
    logger.error('[AssignmentController] Unexpected error:', (err as Error).message);
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: (err as Error).message });
    return;
  } 
};  
export const submitAssignment = async (req: Request, res: Response): Promise<void> => {
  logger.info('[AssignmentController] Student submitting assignment');
  try {
    const studentUserId = req.user?.id;
    if (!studentUserId) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Student ID missing' });
      return;
    }
    if (req.user?.role !== 'STUDENT') {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Forbidden: only students' });
      return;
    }

    const contentType = req.get('content-type');
    if (!contentType) {
      logger.info('[AssignmentController] submitAssignment - missing content-type header');
      res.status(400).json({ error: 'Missing Content-Type header. Send multipart/form-data (with submissionFile) or include fileUrl in the request body.' });
      return;
    }

    const { assignmentId } = req.params;
    // Accept uploaded file (multipart/form-data) or a body-provided fileUrl
    const uploadedFile = (req as any).file as any | undefined;
    let fileUrl = req.body?.fileUrl;
    if (uploadedFile && uploadedFile.buffer) {
      try {
        const cloudUrl = await uploadBufferToCloudinary(uploadedFile.buffer, `submissions/${studentUserId || 'anon'}`);
        fileUrl = cloudUrl;
      } catch (err) {
        logger.error('[AssignmentController] Cloudinary upload failed:', err);
      }
    }
    if (!fileUrl) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'fileUrl required' });
      return;
    }
    const result = await assignmentService.createSubmission(assignmentId, studentUserId, fileUrl);
    if (result.error) {
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: result.error });
      return;
    }
    res.status(HTTP_STATUS_CREATED).json(result.submission);
  } catch (err) {
    logger.error('[AssignmentController] Error submitting assignment:', err);
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Unexpected error' });
  }
};

export const updateSubmissionHandler = async (req: Request, res: Response): Promise<void> => {
  logger.info('[AssignmentController] Student updating submission');
  try {
    const studentUserId = req.user?.id;
    if (!studentUserId) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Student ID missing' });
      return;
    }
    if (req.user?.role !== 'STUDENT') {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Forbidden: only students' });
      return;
    }
    const { submissionId } = req.params;
    // accept an uploaded file or a fileUrl in the form body
    const uploadedFile = (req as any).file as any | undefined;
    let fileUrl = req.body?.fileUrl;
    if (uploadedFile && uploadedFile.buffer) {
      try {
        const cloudUrl = await uploadBufferToCloudinary(uploadedFile.buffer, `submissions/${studentUserId || 'anon'}`);
        fileUrl = cloudUrl;
      } catch (err) {
        logger.error('[AssignmentController] Cloudinary upload failed:', err);
      }
    }
    if (!fileUrl) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'fileUrl required' });
      return;
    }
    const result = await assignmentService.updateSubmission(submissionId, studentUserId, fileUrl);
    if (result.error) {
      const statusCode = result.error.includes('Cannot edit a reviewed submission') || result.error.includes('Forbidden') 
        ? HTTP_STATUS_FORBIDDEN 
        : HTTP_STATUS_INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({ error: result.error });
      return;
    }
    res.json(result.updated);
  } catch (err) {
    logger.error('[AssignmentController] Error updating submission:', err);
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Unexpected error' });
  }
};

export const getMySubmissions = async (req: Request, res: Response): Promise<void> => {
  logger.info('[AssignmentController] Fetching my submissions');
  try {
    const studentUserId = req.user?.id;
    if (!studentUserId) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Student ID missing' });
      return;
    }
    if (req.user?.role !== 'STUDENT') {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Forbidden: only students' });
      return;
    }
    const subs = await assignmentService.getSubmissionsByStudent(studentUserId);
    res.json(subs);
  } catch (err) {
    logger.error('[AssignmentController] Error fetching my submissions:', err);
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Unexpected error' });
  }
};

export const deleteSubmissionHandler = async (req: Request, res: Response): Promise<void> => {
  logger.info('[AssignmentController] Deleting submission');
  try {
    const studentUserId = req.user?.id;
    if (!studentUserId) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Student ID missing' });
      return;
    }
    if (req.user?.role !== 'STUDENT') {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Forbidden: only students' });
      return;
    }
    const { submissionId } = req.params;
    const result = await assignmentService.deleteSubmission(submissionId, studentUserId);
    if (result.error) {
      const statusCode = result.error.includes('Cannot delete a reviewed submission') || result.error.includes('Forbidden')
        ? HTTP_STATUS_FORBIDDEN 
        : HTTP_STATUS_INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({ error: result.error });
      return;
    }
    res.status(HTTP_STATUS_OK).json({ success: true });
  } catch (err) {
    logger.error('[AssignmentController] Error deleting submission:', err);
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Unexpected error' });
  }
};

