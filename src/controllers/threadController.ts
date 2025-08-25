import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from '@constants/constants';

import unitDAO from '@dao/unitDAO';
import studentDAO from '@dao/studentDAO';
import facultyDAO from '@dao/facultyDAO';
import VirtualClassroomStudentDAO from '@dao/virtualClassroomStudentDAO';
import { VirtualClassroomDAO } from '@dao/virtualClassroomDAO';
import { logger } from '@services/logService';
import { threadService } from '@services/threadService';
import { Request, Response } from 'express';

export const threadController = {
  async likeThreadOrReply(req: Request, res: Response) {
    const userId = req.user?.id;
    const { threadId, replyId } = req.body;
    if (!userId) {
      logger.error('[threadController] likeThreadOrReply error', { error: 'User ID not found in request context' });
      return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'User ID not found in request context' });
    }
    if (!threadId && !replyId) {
      logger.error('[threadController] likeThreadOrReply error', {
        error: 'Either threadId or replyId must be provided',
      });
      return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Either threadId or replyId must be provided' });
    }
    try {
      logger.info('[threadController] likeThreadOrReply started', { userId, threadId, replyId });
      const likeToggleResult = await threadService.likeThreadOrReply({ threadId, replyId, userId });
      logger.info('[threadController] likeThreadOrReply success', {
        liked: likeToggleResult.liked,
        threadId: likeToggleResult.threadId || threadId,
        userId,
      });
      res.status(HTTP_STATUS_OK).json(likeToggleResult);
    } catch (error) {
      logger.error('[threadController] likeThreadOrReply error', {
        error: error instanceof Error ? error.message : error,
        userId,
        threadId,
        replyId,
      });
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        error: 'Failed to like/unlike thread or reply',
        details: error instanceof Error ? error.message : error,
      });
    }
  },
  async getThreadsByUnitWithAccess(req: Request, res: Response) {
    const userId = req.user?.id;
    let unitId = req.params.unitId || req.query.unitId;
    if (Array.isArray(unitId)) unitId = unitId[0];
    unitId = typeof unitId === 'string' ? unitId : String(unitId);
    // UUID v4 validation
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!userId || !unitId) {
      return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Missing user or unitId' });
    }
    if (!uuidV4Regex.test(unitId)) {
      return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Invalid unitId format. Must be a valid UUID.' });
    }
    try {
      // 1. Get classroomId for the unit
      const unit = await unitDAO.get(unitId);
      if (!unit || !unit.classroomId) {
        return res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Unit or classroom not found' });
      }
      // 2. Check if user is a member of the classroom (student or faculty)
      let isMember = false;
      // Check student membership
      const student = await studentDAO.getStudentByUserId(userId);
      if (student) {
        const membership = await VirtualClassroomStudentDAO.get({ classroomId: unit.classroomId, studentId: student.id });
        if (membership) isMember = true;
      }
      // Check faculty membership: get faculty by userId, then check if any classroom exists where this faculty is assigned and matches the unit's classroomId
      try {
        const faculty = await facultyDAO.getFacultyByUserId(userId);
        if (faculty && faculty.id) {
          const facultyClassroom = await VirtualClassroomDAO.get({ facultyId: faculty.id, id: unit.classroomId });
          if (facultyClassroom) isMember = true;
        }
      } catch (e) {
        // Ignore if not a faculty
      }
      if (!isMember) {
        return res.status(HTTP_STATUS_FORBIDDEN).json({ error: 'You are not a member of this classroom' });
      }
      // 3. Fetch threads for this unit
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || undefined;
      const filters: Record<string, any> = { unitId };
      for (const key in req.query) {
        if (!['page', 'limit', 'sortBy', 'sortOrder', 'unitId'].includes(key)) {
          filters[key] = req.query[key];
        }
      }
  const threadsData = await threadService.getThreads(page, limit, { sortBy, sortOrder, filters });
  return res.status(HTTP_STATUS_OK).json(threadsData);
    } catch (error) {
      logger.error('[threadController] getThreadsByUnitWithAccess error', {
        error: error instanceof Error ? error.message : error,
        userId,
        unitId,
      });
      return res
        .status(HTTP_STATUS_INTERNAL_SERVER_ERROR)
        .json({ error: 'Failed to fetch threads', details: error instanceof Error ? error.message : error });
    }
  },

  async createThread(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      logger.error('[threadController] createThread error', { error: 'User ID not found in request context' });
      return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'User ID not found in request context' });
    }
    const { unitId } = req.body;
    if (unitId) {
      // UUID v4 validation
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidV4Regex.test(unitId)) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Invalid unitId format. Must be a valid UUID.' });
      }
      try {
        // 1. Get classroomId for the unit
        const unit = await unitDAO.get(unitId);
        if (!unit || !unit.classroomId) {
          return res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Unit or classroom not found' });
        }
        // 2. Check if user is a member of the classroom (student or faculty)
        let isMember = false;
        // Check student membership
        const student = await studentDAO.getStudentByUserId(userId);
        if (student) {
          const membership = await VirtualClassroomStudentDAO.get({
            classroomId: unit.classroomId,
            studentId: student.id,
          });
          if (membership) isMember = true;
        }
        // Check faculty membership: get faculty by userId, then check if any classroom exists where this faculty is assigned and matches the unit's classroomId
        try {
          const faculty = await facultyDAO.getFacultyByUserId(userId);
          if (faculty && faculty.id) {
            // Check if any classroom exists where this faculty is assigned
            const facultyClassroom = await VirtualClassroomDAO.get({ facultyId: faculty.id, id: unit.classroomId });
            if (facultyClassroom) isMember = true;
          }
        } catch (e) {
          // Ignore if not a faculty
        }
        if (!isMember) {
          return res.status(HTTP_STATUS_FORBIDDEN).json({ error: 'You are not a member of this classroom' });
        }
      } catch (error) {
        logger.error('[threadController] createThread classroom membership validation error', {
          error: error instanceof Error ? error.message : error,
          userId,
          unitId,
        });
        return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
          error: 'Failed to validate classroom membership',
          details: error instanceof Error ? error.message : error,
        });
      }
    }
    try {
      logger.info('[threadController] createThread started', { userId });
      const thread = await threadService.createThread(req.body, userId);
      logger.info('[threadController] createThread success', { threadId: thread.id });
      res.status(HTTP_STATUS_CREATED).json(thread);
    } catch (error) {
      logger.error('[threadController] createThread error', {
        error: error instanceof Error ? error.message : error,
        userId,
      });
      res
        .status(HTTP_STATUS_INTERNAL_SERVER_ERROR)
        .json({ error: 'Failed to create thread', details: error instanceof Error ? error.message : error });
    }
  },
  async getThreads(req: Request, res: Response) {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || undefined;
    // Build filters object from all query params except pagination/sort
    const filters: Record<string, any> = {};
    for (const key in req.query) {
      if (!['page', 'limit', 'sortBy', 'sortOrder'].includes(key)) {
        filters[key] = req.query[key];
      }
    }
    try {
      logger.info('[threadController] getThreads started', { page, limit, sortBy, sortOrder, filters });
  const threadsData = await threadService.getThreads(page, limit, { sortBy, sortOrder, filters });
  logger.info('[threadController] getThreads success', { count: threadsData.threads.length });
  res.status(HTTP_STATUS_OK).json(threadsData);
    } catch (error) {
      logger.error('[threadController] getThreads error', {
        error: error instanceof Error ? error.message : error,
        page,
        limit,
        sortBy,
        sortOrder,
        filters,
      });
      res
        .status(HTTP_STATUS_INTERNAL_SERVER_ERROR)
        .json({ error: 'Failed to fetch threads', details: error instanceof Error ? error.message : error });
    }
  },
  async getThreadWithReplies(req: Request, res: Response) {
    const threadId = req.params.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    try {
      logger.info('[threadController] getThreadWithReplies started', { threadId, page, limit });
      const threadWithReplies = await threadService.getThreadWithReplies(threadId, page, limit);
      if (!threadWithReplies) {
        logger.warn('[threadController] getThreadWithReplies not found', { threadId });
        return res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Thread not found' });
      }
      logger.info('[threadController] getThreadWithReplies success', { threadId });
      res.status(HTTP_STATUS_OK).json(threadWithReplies);
    } catch (error) {
      logger.error('[threadController] getThreadWithReplies error', {
        error: error instanceof Error ? error.message : error,
        threadId,
        page,
        limit,
      });
      res
        .status(HTTP_STATUS_INTERNAL_SERVER_ERROR)
        .json({ error: 'Failed to fetch thread replies', details: error instanceof Error ? error.message : error });
    }
  },
  async createReply(req: Request, res: Response) {
    const userId = req.user?.id;
    const parentId = req.params.id;
    const { content } = req.body;
    if (!userId) {
      logger.error('[threadController] createReply error', { error: 'User ID not found in request context' });
      return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'User ID not found in request context' });
    }
    if (!content) {
      logger.error('[threadController] createReply error', { error: 'Content is required' });
      return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Content is required' });
    }
    try {
      logger.info('[threadController] createReply started', { parentId, userId });
  const createdReply = await threadService.createReply(parentId, content, userId);
  logger.info('[threadController] createReply success', { replyId: createdReply.id });
  res.status(HTTP_STATUS_CREATED).json(createdReply);
    } catch (error) {
      logger.error('[threadController] createReply error', {
        error: error instanceof Error ? error.message : error,
        parentId,
        userId,
      });
      res
        .status(HTTP_STATUS_INTERNAL_SERVER_ERROR)
        .json({ error: 'Failed to create reply', details: error instanceof Error ? error.message : error });
    }
  },

  async acceptAnswer(req: Request, res: Response) {
    const { threadId, replyId } = req.params;
    const userId = req.user?.id;
    try {
      logger.info('[threadController] acceptAnswer started', { threadId, replyId, userId });
      // Fetch the main thread to check ownership
      const mainThread = await threadService.getThreadById(threadId);
      if (!mainThread || mainThread.parentId !== null) {
        logger.warn('[threadController] acceptAnswer failed: not a main thread', { threadId });
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Cannot accept answer for this thread.' });
      }
      if (!userId || mainThread.userId !== userId) {
        logger.warn('[threadController] acceptAnswer failed: unauthorized', { threadId, userId });
        return res.status(HTTP_STATUS_FORBIDDEN).json({ error: 'Only the thread owner can accept an answer.' });
      }
      const acceptAnswerResult = await threadService.acceptAnswer(threadId, replyId);
      if (!acceptAnswerResult) {
        logger.warn('[threadController] acceptAnswer failed', { threadId, replyId });
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Cannot accept answer for this thread.' });
      }
      // If the answer was unmarked, acceptedAnswerId will be null
      const isUnmarked = acceptAnswerResult.acceptedAnswerId === null;
      logger.info('[threadController] acceptAnswer success', {
        threadId,
        replyId,
        acceptedAnswerId: acceptAnswerResult.acceptedAnswerId,
      });
      res.status(HTTP_STATUS_OK).json({ acceptedAnswerId: isUnmarked ? null : replyId });
    } catch (error) {
      logger.error('[threadController] acceptAnswer error', {
        error: error instanceof Error ? error.message : error,
        threadId,
        replyId,
      });
      res
        .status(HTTP_STATUS_INTERNAL_SERVER_ERROR)
        .json({ error: 'Failed to accept answer', details: error instanceof Error ? error.message : error });
    }
  },
};
