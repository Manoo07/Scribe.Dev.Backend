import { logger } from '@services/logService';
import { threadService } from '@services/threadService';
import { Request, Response } from 'express';

export const threadController = {
  async updateThreadOrComment(req: Request, res: Response) {
    const userId = req.user?.id;
    const { threadId } = req.params;
    const { title, content } = req.body;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const updated = await threadService.updateThreadOrComment(threadId, userId, { title, content });
      res.status(200).json({ message: 'Updated successfully', thread: updated });
    } catch (error: any) {
      if (error.message === 'Thread or comment not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Forbidden: Not the owner') {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === 'No valid fields to update') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update', details: error.message });
    }
  },
  async deleteThreadOrComment(req: Request, res: Response) {
    const userId = req.user?.id;
    const { threadId } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      await threadService.deleteThreadOrComment(threadId, userId);
      res.status(200).json({ message: 'Deleted successfully' });
    } catch (error: any) {
      if (error.message === 'Thread or comment not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Forbidden: Not the owner') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to delete', details: error.message });
    }
  },
  async likeThreadOrReply(req: Request, res: Response) {
    const userId = req.user?.id;
    const { threadId, replyId } = req.body;
    if (!userId) {
      logger.error('[threadController] likeThreadOrReply error', { error: 'User ID not found in request context' });
      return res.status(400).json({ error: 'User ID not found in request context' });
    }
    if (!threadId && !replyId) {
      logger.error('[threadController] likeThreadOrReply error', {
        error: 'Either threadId or replyId must be provided',
      });
      return res.status(400).json({ error: 'Either threadId or replyId must be provided' });
    }
    try {
      logger.info('[threadController] likeThreadOrReply started', { userId, threadId, replyId });
      const result = await threadService.likeThreadOrReply({ threadId, replyId, userId });
      logger.info('[threadController] likeThreadOrReply success', {
        liked: result.liked,
        threadId: result.threadId || threadId,
        userId,
      });
      res.status(200).json(result);
    } catch (error) {
      logger.error('[threadController] likeThreadOrReply error', {
        error: error instanceof Error ? error.message : error,
        userId,
        threadId,
        replyId,
      });
      res.status(500).json({
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
      return res.status(400).json({ error: 'Missing user or unitId' });
    }
    if (!uuidV4Regex.test(unitId)) {
      return res.status(400).json({ error: 'Invalid unitId format. Must be a valid UUID.' });
    }
    try {
      // 1. Get classroomId for the unit
      const unitDAO = (await import('@dao/unitDAO')).default;
      const unit = await unitDAO.get(unitId);
      if (!unit || !unit.classroomId) {
        return res.status(404).json({ error: 'Unit or classroom not found' });
      }
      // 2. Check if user is a member of the classroom (student or faculty)
      const [studentDAO, facultyDAO, vClassStudentDAO] = await Promise.all([
        import('@dao/studentDAO'),
        import('@dao/facultyDAO'),
        import('@dao/virtualClassroomStudentDAO'),
      ]);
      let isMember = false;
      // Check student membership
      const student = await studentDAO.default.getStudentByUserId(userId);
      if (student) {
        const membership = await vClassStudentDAO.default.get({ classroomId: unit.classroomId, studentId: student.id });
        if (membership) isMember = true;
      }
      // Check faculty membership: get faculty by userId, then check if any classroom exists where this faculty is assigned and matches the unit's classroomId
      try {
        const faculty = await facultyDAO.default.getFacultyByUserId(userId);
        if (faculty && faculty.id) {
          const { VirtualClassroomDAO } = await import('@dao/virtualClassroomDAO');
          const facultyClassroom = await VirtualClassroomDAO.get({ facultyId: faculty.id, id: unit.classroomId });
          if (facultyClassroom) isMember = true;
        }
      } catch (e) {
        // Ignore if not a faculty
      }
      if (!isMember) {
        return res.status(403).json({ error: 'You are not a member of this classroom' });
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
      const result = await threadService.getThreads(page, limit, { sortBy, sortOrder, filters, userId });
      return res.status(200).json(result);
    } catch (error) {
      logger.error('[threadController] getThreadsByUnitWithAccess error', {
        error: error instanceof Error ? error.message : error,
        userId,
        unitId,
      });
      return res
        .status(500)
        .json({ error: 'Failed to fetch threads', details: error instanceof Error ? error.message : error });
    }
  },

  async createThread(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      logger.error('[threadController] createThread error', { error: 'User ID not found in request context' });
      return res.status(400).json({ error: 'User ID not found in request context' });
    }
    const { unitId } = req.body;
    if (unitId) {
      // UUID v4 validation
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidV4Regex.test(unitId)) {
        return res.status(400).json({ error: 'Invalid unitId format. Must be a valid UUID.' });
      }
      try {
        // 1. Get classroomId for the unit
        const unitDAO = (await import('@dao/unitDAO')).default;
        const unit = await unitDAO.get(unitId);
        if (!unit || !unit.classroomId) {
          return res.status(404).json({ error: 'Unit or classroom not found' });
        }
        // 2. Check if user is a member of the classroom (student or faculty)
        const [studentDAO, facultyDAO, vClassStudentDAO] = await Promise.all([
          import('@dao/studentDAO'),
          import('@dao/facultyDAO'),
          import('@dao/virtualClassroomStudentDAO'),
        ]);
        let isMember = false;
        // Check student membership
        const student = await studentDAO.default.getStudentByUserId(userId);
        if (student) {
          const membership = await vClassStudentDAO.default.get({
            classroomId: unit.classroomId,
            studentId: student.id,
          });
          if (membership) isMember = true;
        }
        // Check faculty membership: get faculty by userId, then check if any classroom exists where this faculty is assigned and matches the unit's classroomId
        try {
          const faculty = await facultyDAO.default.getFacultyByUserId(userId);
          if (faculty && faculty.id) {
            // Check if any classroom exists where this faculty is assigned
            const { VirtualClassroomDAO } = await import('@dao/virtualClassroomDAO');
            const facultyClassroom = await VirtualClassroomDAO.get({ facultyId: faculty.id, id: unit.classroomId });
            if (facultyClassroom) isMember = true;
          }
        } catch (e) {
          // Ignore if not a faculty
        }
        if (!isMember) {
          return res.status(403).json({ error: 'You are not a member of this classroom' });
        }
      } catch (error) {
        logger.error('[threadController] createThread classroom membership validation error', {
          error: error instanceof Error ? error.message : error,
          userId,
          unitId,
        });
        return res.status(500).json({
          error: 'Failed to validate classroom membership',
          details: error instanceof Error ? error.message : error,
        });
      }
    }
    try {
      logger.info('[threadController] createThread started', { userId });
      const thread = await threadService.createThread(req.body, userId);
      logger.info('[threadController] createThread success', { threadId: thread.id });
      res.status(201).json(thread);
    } catch (error) {
      logger.error('[threadController] createThread error', {
        error: error instanceof Error ? error.message : error,
        userId,
      });
      res
        .status(500)
        .json({ error: 'Failed to create thread', details: error instanceof Error ? error.message : error });
    }
  },
  async getThreads(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      logger.error('[threadController] getThreads error', { error: 'User ID not found in request context' });
      return res.status(400).json({ error: 'User ID not found in request context' });
    }
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
    // If unitId is not present in query, fetch threads with null unitId
    if (!('unitId' in req.query)) {
      filters.unitId = 'none';
    }
    // If classroomId is present in query, filter by classroomId
    if ('classroomId' in req.query) {
      filters.classroomId = req.query.classroomId;
    }
    try {
      logger.info('[threadController] getThreads started', { page, limit, sortBy, sortOrder, filters });
      const result = await threadService.getThreads(page, limit, { sortBy, sortOrder, filters, userId });
      logger.info('[threadController] getThreads success', { count: result.threads.length });
      res.status(200).json(result);
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
        .status(500)
        .json({ error: 'Failed to fetch threads', details: error instanceof Error ? error.message : error });
    }
  },
  async getThreadWithReplies(req: Request, res: Response) {
    const { id: threadId } = req.params;
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    if (!threadId) {
      return res.status(400).json({ error: 'Thread ID is required' });
    }

    try {
      logger.info('[threadController] getThreadWithReplies started', { threadId, userId, page, limit });
      const thread = await threadService.getThreadWithReplies(threadId, page, limit, userId);

      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      logger.info('[threadController] getThreadWithReplies success', { threadId });
      res.status(200).json(thread);
    } catch (error) {
      logger.error('[threadController] getThreadWithReplies error', {
        error: error instanceof Error ? error.message : error,
        threadId,
        userId,
        page,
        limit,
      });
      res.status(500).json({
        error: 'Failed to fetch thread with replies',
        details: error instanceof Error ? error.message : error,
      });
    }
  },

  async createReply(req: Request, res: Response) {
    const userId = req.user?.id;
    const { id: parentId } = req.params;
    const { content } = req.body;

    if (!userId) {
      logger.error('[threadController] createReply error', { error: 'User ID not found in request context' });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!parentId) {
      logger.error('[threadController] createReply error', { error: 'Parent ID is required' });
      return res.status(400).json({ error: 'Parent ID is required' });
    }

    if (!content) {
      logger.error('[threadController] createReply error', { error: 'Content is required' });
      return res.status(400).json({ error: 'Content is required' });
    }

    try {
      logger.info('[threadController] createReply started', { parentId, userId });
      const reply = await threadService.createReply(parentId, content, userId);
      logger.info('[threadController] createReply success', { replyId: reply.id });
      res.status(201).json(reply);
    } catch (error) {
      logger.error('[threadController] createReply error', {
        error: error instanceof Error ? error.message : error,
        parentId,
        userId,
      });
      res
        .status(500)
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
        return res.status(400).json({ error: 'Cannot accept answer for this thread.' });
      }
      if (!userId || mainThread.userId !== userId) {
        logger.warn('[threadController] acceptAnswer failed: unauthorized', { threadId, userId });
        return res.status(403).json({ error: 'Only the thread owner can accept an answer.' });
      }
      const result = await threadService.acceptAnswer(threadId, replyId);
      if (!result) {
        logger.warn('[threadController] acceptAnswer failed', { threadId, replyId });
        return res.status(400).json({ error: 'Cannot accept answer for this thread.' });
      }
      // If the answer was unmarked, acceptedAnswerId will be null
      const isUnmarked = result.acceptedAnswerId === null;
      logger.info('[threadController] acceptAnswer success', {
        threadId,
        replyId,
        acceptedAnswerId: result.acceptedAnswerId,
      });
      res.status(200).json({ acceptedAnswerId: isUnmarked ? null : replyId });
    } catch (error) {
      logger.error('[threadController] acceptAnswer error', {
        error: error instanceof Error ? error.message : error,
        threadId,
        replyId,
      });
      res
        .status(500)
        .json({ error: 'Failed to accept answer', details: error instanceof Error ? error.message : error });
    }
  },
};
