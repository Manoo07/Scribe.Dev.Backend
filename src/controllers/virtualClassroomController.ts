import { VirtualClassroomService } from '@services/virtualClassroomService';
import { Request, Response } from 'express';
import { logger } from '@services/logService';
import {
  ALLOWED_FILTER_KEYS,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_OK,
} from '@constants/constants';
import { PrismaClient } from '@prisma/client';
import studentDAO from '@dao/studentDAO';
import FacultyDAO from '@dao/facultyDAO';

// Initialize Logger
logger.info('[VirtualClassroomController] Initialized');

export interface VirtualClassroomParams {
  name: string;
  facultyId: string;
  sectionId: string;
  syllabusUrl?: string;
}

export class VirtualClassroomController {
  virtualClassroomService: VirtualClassroomService;
  prisma: PrismaClient;

  constructor() {
    this.virtualClassroomService = new VirtualClassroomService();
    this.prisma = new PrismaClient();
  }


  // Helper method to validate missing fields
  private validateFields(fields: { key: string; value: any }[], res: Response): boolean {
    const missing = fields.filter((field) => !field.value).map((field) => field.key);
    if (missing.length > 0) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({
        message: `${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} required`,
      });
      return false;
    }
    return true;
  }

  private validateFilter = (filter: any): string[] => {
    if (!filter || typeof filter !== 'object' || Array.isArray(filter)) {
      throw new Error('Filter must be a valid object');
    }
    const invalidKeys = Object.keys(filter).filter((key) => !ALLOWED_FILTER_KEYS.has(key));
    return invalidKeys;
  };

  // Create Virtual Classroom
  createClassroom = async (req: Request, res: Response) => {

    try {
      if (!req.user || !req.user.id) {
        throw new Error("Unauthorized: User ID missing from request.");
      }
      const userId = req.user.id;
      const { name, syllabusUrl, sectionId }: VirtualClassroomParams = req.body;

      if (
        !this.validateFields(
          [
            { key: 'User ID', value: userId },
            { key: 'Name', value: name },
            { key: 'Section ID', value: sectionId },
          ],
          res
        )
      ) {
        return;
      }

      const faculty = await FacultyDAO.getFacultyByUserId(userId);
      if (!faculty?.id) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ message: 'Faculty not found for the given User ID' });
      }

      const classroom = await this.virtualClassroomService.createVirtualClassroom({
        name,
        facultyId: faculty.id,
        syllabusUrl,
        sectionId,
      });

      if (!classroom) {
        logger.error('[VirtualClassroomController] Failed to create classroom');
        return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ message: 'Failed to create virtual classroom' });
      }

      logger.info('[VirtualClassroomController] Virtual classroom created:', classroom.id);
      return res.status(HTTP_STATUS_CREATED).json({ message: 'Virtual classroom created successfully', classroom });
    } catch (error) {
      logger.error('[VirtualClassroomController] Error creating virtual classroom:', error);
      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Failed to create virtual classroom',
        error: (error as Error).message,
      });
    }
  };

  //getClassroom
  getClassroom = async (req: Request, res: Response) => {
    try {
      const { filter } = req.body;
      if (filter) {
        if (typeof filter !== 'object' || Array.isArray(filter)) {
          return res.status(HTTP_STATUS_BAD_REQUEST).json({
            message: 'Filter must be a valid object',
          });
        }

        const invalidKeys = Object.keys(filter).filter((key) => !ALLOWED_FILTER_KEYS.has(key));
        if (invalidKeys.length > 0) {
          return res.status(HTTP_STATUS_BAD_REQUEST).json({
            message: `Invalid filter field(s): ${invalidKeys.join(', ')}`,
          });
        }
      }
      const classrooms = await this.virtualClassroomService.getVirtualClassroom(filter);
      return res.status(HTTP_STATUS_OK).json({ classrooms });
    } catch (error) {
      logger.error('[VirtualClassroomController] Error fetching classrooms:', error);
      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Failed to fetch virtual classrooms',
        error: (error as Error).message,
      });
    }
  };
  getClassrooms = async (req: Request, res: Response) => {
    try {
      const { filter } = req.body;
      if (filter) {
        if (typeof filter !== 'object' || Array.isArray(filter)) {
          return res.status(HTTP_STATUS_BAD_REQUEST).json({
            message: 'Filter must be a valid object',
          });
        }

        const invalidKeys = Object.keys(filter).filter((key) => !ALLOWED_FILTER_KEYS.has(key));
        if (invalidKeys.length > 0) {
          return res.status(HTTP_STATUS_BAD_REQUEST).json({
            message: `Invalid filter field(s): ${invalidKeys.join(', ')}`,
          });
        }
      }
      const classrooms = await this.virtualClassroomService.getAllVirtualClassrooms(filter);
      return res.status(HTTP_STATUS_OK).json({ classrooms });
    } catch (error) {
      logger.error('[VirtualClassroomController] Error fetching classrooms:', error);
      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Failed to fetch virtual classrooms',
        error: (error as Error).message,
      });
    }
  };

  // Join Virtual Classroom
  joinClassroom = async (req: Request, res: Response) => {
    try {
      const { classroomId } = await req.body;
      const userId = req.user?.id; if (!req.user || !req.user.id) {
        throw new Error("Unauthorized: User ID missing from request.");
      }
      logger.info(`[VirtualClassroomController] User ID: ${userId}`);
      logger.info(`[VirtualClassroomController] Classroom ID: ${classroomId}`);
      if (
        !this.validateFields(
          [
            { key: 'User ID', value: userId },
            { key: 'Classroom ID', value: classroomId },
          ],
          res
        )
      ) {
        return;
      }
      if (!userId) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ message: 'User ID is required' });
      }
      const student = await studentDAO.getStudentByUserId(userId);
      if (!student?.id) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ message: 'Student not found for the given User ID' });
      }

      const isAlreadyEnrolled = await this.virtualClassroomService.isStudentEnrolled(student.id, classroomId);
      if (isAlreadyEnrolled) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ message: 'Student is already enrolled in the classroom' });
      }
      logger.info(`[VirtualClassroomController] Student ID: ${student.id}`);
      logger.info(`[VirtualClassroomController] Classroom ID: ${classroomId}`);
      await this.virtualClassroomService.joinClassroom(student.id, classroomId);

      logger.info('[VirtualClassroomController] Student joined classroom:', classroomId);
      return res.status(HTTP_STATUS_OK).json({ message: 'Joined virtual classroom successfully' });
    } catch (error) {
      logger.error('[VirtualClassroomController] Error joining classroom:', error);
      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Failed to join virtual classroom',
        error: (error as Error).message,
      });
    }
  };

  // Leave Virtual Classroom
  leaveClassroom = async (req: Request, res: Response) => {

    try {
      const { classroomId } = req.body;

      if (!req.user || !req.user.id) {
        throw new Error("Unauthorized: User ID missing from request.");
      }
      const userId = req.user.id;

      if (
        !this.validateFields(
          [
            { key: 'User ID', value: userId },
            { key: 'Classroom ID', value: classroomId },
          ],
          res
        )
      ) {
        return;
      }
      logger.info(`[VirtualClassroomController] User ID: ${userId}`);
      const student = await studentDAO.getStudentByUserId(userId);
      const studentId = student?.id;
      logger.info(`[VirtualClassroomController] Student ID: ${studentId}`);
      logger.info(`[VirtualClassroomController] Classroom ID: ${classroomId}`);

      if (!studentId) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ message: 'Student not found for the given User ID' });
      }

      const result = await this.virtualClassroomService.leaveClassroom(studentId, classroomId);

      if (!result) {
        logger.error('[VirtualClassroomController] Failed to leave virtual classroom');
        return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ message: 'Failed to leave virtual classroom' });
      }

      logger.info('[VirtualClassroomController] Student left classroom:', classroomId);
      return res.status(HTTP_STATUS_OK).json({ message: 'Left virtual classroom successfully' });
    } catch (error) {
      logger.error('[VirtualClassroomController] Error leaving classroom:', error);
      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Failed to leave virtual classroom',
        error: (error as Error).message,
      });
    }
  };
}
