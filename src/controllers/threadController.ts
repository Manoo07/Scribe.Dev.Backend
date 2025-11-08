import { logger } from '@services/logService';
import { threadService } from '@services/threadService';
import { Request, Response } from 'express';
import { isValidUUID, normalizeQueryParam } from '@utils/validators';
import { checkClassroomMembership } from '@utils/classroomAccess';

export const threadController = {
  /**
   * Update a thread or comment (title/content)
   * Only the owner can update their thread or comment
   */
  async updateThreadOrComment(req: Request, res: Response) {
    const userId = req.user?.id;
    const { threadId } = req.params;
    const { title, content } = req.body;
    
    if (!userId) {
      logger.error('[threadController] updateThreadOrComment - Unauthorized: no userId');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
      logger.info('[threadController] updateThreadOrComment started', { threadId, userId });
      const updated = await threadService.updateThreadOrComment(threadId, userId, { title, content });
      logger.info('[threadController] updateThreadOrComment success', { threadId });
      res.status(200).json({ message: 'Updated successfully', thread: updated });
    } catch (error: any) {
      logger.error('[threadController] updateThreadOrComment error', {
        error: error instanceof Error ? error.message : error,
        threadId,
        userId,
      });
      
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
  /**
   * Delete a thread or comment
   * Only the owner can delete their thread or comment
   */
  async deleteThreadOrComment(req: Request, res: Response) {
    const userId = req.user?.id;
    const { threadId } = req.params;
    
    if (!userId) {
      logger.error('[threadController] deleteThreadOrComment - Unauthorized: no userId');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
      logger.info('[threadController] deleteThreadOrComment started', { threadId, userId });
      await threadService.deleteThreadOrComment(threadId, userId);
      logger.info('[threadController] deleteThreadOrComment success', { threadId });
      res.status(200).json({ message: 'Deleted successfully' });
    } catch (error: any) {
      logger.error('[threadController] deleteThreadOrComment error', {
        error: error instanceof Error ? error.message : error,
        threadId,
        userId,
      });
      
      if (error.message === 'Thread or comment not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Forbidden: Not the owner') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to delete', details: error.message });
    }
  },
  /**
   * Like or unlike a thread or reply
   */
  async likeThreadOrReply(req: Request, res: Response) {
    const userId = req.user?.id;
    const { id: threadId } = req.params;

    if (!userId) {
      logger.error('[threadController] likeThreadOrReply - Unauthorized: no userId');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!threadId) {
      logger.error('[threadController] likeThreadOrReply - Thread ID missing');
      return res.status(400).json({ error: 'Thread ID is required' });
    }

    try {
      logger.info('[threadController] likeThreadOrReply started', { threadId, userId });
      const result = await threadService.likeThreadOrReply({ threadId, userId });
      logger.info('[threadController] likeThreadOrReply success', { 
        threadId, 
        liked: result.liked 
      });
      res.status(200).json(result);
    } catch (error) {
      logger.error('[threadController] likeThreadOrReply error', {
        error: error instanceof Error ? error.message : error,
        threadId,
        userId,
      });
      res.status(500).json({ 
        error: 'Failed to like/unlike thread', 
        details: error instanceof Error ? error.message : error 
      });
    }
  },
  /**
   * Get threads by unit with access control
   * Validates user is a member of the classroom before returning threads
   */
  async getThreadsByUnitWithAccess(req: Request, res: Response) {
    const userId = req.user?.id;
    let unitId = normalizeQueryParam(req.params.unitId as string) || normalizeQueryParam(req.query.unitId as string);
    
    if (!userId || !unitId) {
      logger.error('[threadController] getThreadsByUnitWithAccess - Missing userId or unitId');
      return res.status(400).json({ error: 'Missing user or unitId' });
    }
    
    if (!isValidUUID(unitId)) {
      logger.error('[threadController] getThreadsByUnitWithAccess - Invalid unitId format', { unitId });
      return res.status(400).json({ error: 'Invalid unitId format. Must be a valid UUID.' });
    }
    
    try {
      logger.info('[threadController] getThreadsByUnitWithAccess started', { userId, unitId });
      
      // Get classroomId for the unit
      const unitDAO = (await import('@dao/unitDAO')).default;
      const unit = await unitDAO.get(unitId);
      
      if (!unit || !unit.classroomId) {
        logger.warn('[threadController] getThreadsByUnitWithAccess - Unit or classroom not found', { unitId });
        return res.status(404).json({ error: 'Unit or classroom not found' });
      }
      
      // Check classroom membership
      const isMember = await checkClassroomMembership(userId, unit.classroomId);
      
      if (!isMember) {
        logger.warn('[threadController] getThreadsByUnitWithAccess - User not a member', { userId, classroomId: unit.classroomId });
        return res.status(403).json({ error: 'You are not a member of this classroom' });
      }
      
      // Fetch threads for this unit
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
      logger.info('[threadController] getThreadsByUnitWithAccess success', { count: result.threads.length });
      return res.status(200).json(result);
    } catch (error) {
      logger.error('[threadController] getThreadsByUnitWithAccess error', {
        error: error instanceof Error ? error.message : error,
        userId,
        unitId,
      });
      return res.status(500).json({ 
        error: 'Failed to fetch threads', 
        details: error instanceof Error ? error.message : error 
      });
    }
  },

  /**
   * Create a new thread
   * Validates classroom membership if unitId is provided
   */
  async createThread(req: Request, res: Response) {
    const userId = req.user?.id;
    
    if (!userId) {
      logger.error('[threadController] createThread - User ID not found');
      return res.status(400).json({ error: 'User ID not found in request context' });
    }
    
    const { unitId } = req.body;
    
    // Validate unitId and check classroom membership if provided
    if (unitId) {
      if (!isValidUUID(unitId)) {
        logger.error('[threadController] createThread - Invalid unitId format', { unitId });
        return res.status(400).json({ error: 'Invalid unitId format. Must be a valid UUID.' });
      }
      
      try {
        logger.info('[threadController] createThread - Validating classroom membership', { userId, unitId });
        
        // Get classroomId for the unit
        const unitDAO = (await import('@dao/unitDAO')).default;
        const unit = await unitDAO.get(unitId);
        
        if (!unit || !unit.classroomId) {
          logger.warn('[threadController] createThread - Unit or classroom not found', { unitId });
          return res.status(404).json({ error: 'Unit or classroom not found' });
        }
        
        // Check classroom membership
        const isMember = await checkClassroomMembership(userId, unit.classroomId);
        
        if (!isMember) {
          logger.warn('[threadController] createThread - User not a member', { userId, classroomId: unit.classroomId });
          return res.status(403).json({ error: 'You are not a member of this classroom' });
        }
      } catch (error) {
        logger.error('[threadController] createThread - Classroom membership validation error', {
          error: error instanceof Error ? error.message : String(error),
          userId,
          unitId,
        });
        return res.status(500).json({
          error: 'Failed to validate classroom membership',
          details: error instanceof Error ? error.message : String(error),
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
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      res.status(500).json({ 
        error: 'Failed to create thread', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  },
  /**
   * Get threads with filtering support
   * Supports global threads (no classroomId) or classroom-specific threads
   */
  async getThreads(req: Request, res: Response) {
    const userId = req.user?.id;
    
    if (!userId) {
      logger.error('[threadController] getThreads - User ID not found');
      return res.status(400).json({ error: 'User ID not found in request context' });
    }
    
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    // Sorting parameters
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || undefined;
    
    // Build filters from query params
    const filters: Record<string, any> = {};
    for (const key in req.query) {
      if (!['page', 'limit', 'sortBy', 'sortOrder'].includes(key)) {
        filters[key] = req.query[key];
      }
    }
    
    // Handle classroom filtering logic
    if ('classroomId' in req.query) {
      filters.classroomId = normalizeQueryParam(req.query.classroomId as string);
    } else {
      // No classroomId -> fetch global threads only
      filters.classroomId = 'global';
      if (!('unitId' in req.query)) {
        filters.unitId = 'none';
      }
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
      res.status(500).json({ 
        error: 'Failed to fetch threads', 
        details: error instanceof Error ? error.message : error 
      });
    }
  },
  /**
   * Get a thread with its replies (paginated)
   */
  async getThreadWithReplies(req: Request, res: Response) {
    const { id: threadId } = req.params;
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    if (!threadId) {
      logger.error('[threadController] getThreadWithReplies - Thread ID missing');
      return res.status(400).json({ error: 'Thread ID is required' });
    }

    try {
      logger.info('[threadController] getThreadWithReplies started', { threadId, userId, page, limit });
      const thread = await threadService.getThreadWithReplies(threadId, page, limit, userId);

      if (!thread) {
        logger.warn('[threadController] getThreadWithReplies - Thread not found', { threadId });
        return res.status(404).json({ error: 'Thread not found' });
      }

      logger.info('[threadController] getThreadWithReplies success', { threadId, repliesCount: thread.replies.data.length });
      res.status(200).json(thread);
    } catch (error) {
      logger.error('[threadController] getThreadWithReplies error', {
        error: error instanceof Error ? error.message : String(error),
        threadId,
        userId,
        page,
        limit,
      });
      res.status(500).json({
        error: 'Failed to fetch thread with replies',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  },

  /**
   * Create a reply to a thread
   */
  async createReply(req: Request, res: Response) {
    const userId = req.user?.id;
    const { id: parentId } = req.params;
    const { content } = req.body;

    if (!userId) {
      logger.error('[threadController] createReply - Unauthorized: no userId');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!parentId) {
      logger.error('[threadController] createReply - Parent ID missing');
      return res.status(400).json({ error: 'Parent ID is required' });
    }

    if (!content) {
      logger.error('[threadController] createReply - Content missing');
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
      res.status(500).json({ 
        error: 'Failed to create reply', 
        details: error instanceof Error ? error.message : error 
      });
    }
  },

  /**
   * Accept a reply as the answer to a thread (or unmark it)
   */
  async acceptAnswer(req: Request, res: Response) {
    const { threadId, replyId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      logger.error('[threadController] acceptAnswer - Unauthorized: no userId');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!threadId || !replyId) {
      logger.error('[threadController] acceptAnswer - Missing parameters', { threadId, replyId });
      return res.status(400).json({ error: 'Thread ID and Reply ID are required' });
    }

    try {
      logger.info('[threadController] acceptAnswer started', { threadId, replyId, userId });

      // Fetch the main thread to check ownership
      const mainThread = await threadService.getThreadById(threadId);
      if (!mainThread || mainThread.parentId !== null) {
        logger.warn('[threadController] acceptAnswer - Not a main thread', { threadId });
        return res.status(400).json({ error: 'Cannot accept answer for this thread.' });
      }

      if (mainThread.userId !== userId) {
        logger.warn('[threadController] acceptAnswer - Forbidden: not thread owner', { 
          threadId, 
          threadOwner: mainThread.userId, 
          requestingUser: userId 
        });
        return res.status(403).json({ error: 'Only the thread owner can accept an answer.' });
      }

      const result = await threadService.acceptAnswer(threadId, replyId);
      if (!result) {
        logger.warn('[threadController] acceptAnswer - Failed to update', { threadId, replyId });
        return res.status(400).json({ error: 'Cannot accept answer for this thread.' });
      }

      // If the answer was unmarked, acceptedAnswerId will be null
      const isUnmarked = result.acceptedAnswerId === null;
      logger.info('[threadController] acceptAnswer success', {
        threadId,
        replyId,
        acceptedAnswerId: result.acceptedAnswerId,
        action: isUnmarked ? 'unmarked' : 'accepted',
      });

      res.status(200).json({ acceptedAnswerId: isUnmarked ? null : replyId });
    } catch (error) {
      logger.error('[threadController] acceptAnswer error', {
        error: error instanceof Error ? error.message : error,
        threadId,
        replyId,
        userId,
      });
      res.status(500).json({ 
        error: 'Failed to accept answer', 
        details: error instanceof Error ? error.message : error 
      });
    }
  },
};
