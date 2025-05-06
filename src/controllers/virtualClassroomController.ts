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
import UserDAO from '@dao/userDAO';

const prisma = new PrismaClient();

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
      let { filter } = req.body;
      logger.info(`[VirtualClassroomController] : Hi there`);
      if (!filter) {
        logger.info(`[VirtualClassroomController] : Setting the filter`);
        const userId = req.user.id;
        logger.info(`[VirtualClassroomController] : fetching userId : ${userId}`);
        const faculty = await FacultyDAO.getFacultyByUserId(userId);
        logger.info(`[VirtualClassroomController] : Fetched facultyId : ${faculty.id}`);
        filter = {
          facultyId: faculty.id,
        };
        logger.info(`[VirtualClassroomController] : filter : ${filter}`);
      }

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

  getEligibleStudents = async (req: Request, res: Response) => {
    try {
      const classroomId = req.params.id;
      logger.info(`GetEligilbleStudents : Fetched ClassroomId ${classroomId}`);
      // Fetch classroom with section, faculty, and their college/department info if needed
      const classroom = await prisma.virtualClassroom.findUnique({
        where: { id: classroomId },
        include: {
          section: true,
          faculty: {
            include: {
              user: {
                include: {
                  userRole: true, // to potentially access department/college if needed
                },
              },
            },
          },
        },
      });
      logger.info(`GetEligilbleStudents : Fetched classroom ${classroom}`);
      if (!classroom) {
        return res.status(404).json({ error: 'Classroom not found' });
      }

      const sectionId = classroom.sectionId;
      logger.info(`GetEligilbleStudents : Fetched sectionId ${sectionId}`);

      // Get already enrolled student IDs
      const enrolled = await prisma.virtualClassroomStudent.findMany({
        where: { classroomId },
        select: { studentId: true },
      });
      logger.info(`GetEligilbleStudents : Fetched enrolled stduents ${JSON.stringify(enrolled)}`);

      const enrolledIds = enrolled.map((e) => e.studentId);
      logger.info(`GetEligilbleStudents : Fetched enrolled stduentIds ${JSON.stringify(enrolledIds)}`);

      // Find eligible students by joining through user → userRole
      const eligibleStudentsRaw = await prisma.student.findMany({
        where: {
          id: { notIn: enrolledIds },
          user: {
            userRole: {
              sectionId: sectionId,
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
      const eligibleStudents = eligibleStudentsRaw.map((student) => ({
        ...student,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        userId: student.user.id,
      }));
      logger.info(`GetEligilbleStudents : Fetched elgible students ${JSON.stringify(eligibleStudents)}`);
      res.status(200).json(eligibleStudents);
    } catch (error) {
      logger.error('Error fetching eligible students:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getEnrolledStudents = async (req: Request, res: Response) => {
    try {
      const classroomId = req.params.id;
      logger.info(`GetEligilbleStudents : Fetched ClassroomId ${classroomId}`);
      const enrolledStudents = await prisma.virtualClassroom.findUnique({
        where: { id: classroomId },
        include: {
          virtualClassroomStudents: {
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      id:true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const flattenedStudents = enrolledStudents?.virtualClassroomStudents.map((entry) => ({
        id: entry.student.id,
        enrollmentNo: entry.student.enrollmentNo,
        createdAt: entry.student.createdAt,
        updatedAt: entry.student.updatedAt,
        firstName: entry.student.user.firstName,
        lastName: entry.student.user.lastName,
        email: entry.student.user.email,
        userId: entry.student.user.id
      }));

      logger.info(`GetEligibleStudents : Fetched enrolled students ${JSON.stringify(flattenedStudents)}`);
      res.status(200).json(flattenedStudents);
    } catch (error) {
      logger.error('Error fetching eligible students:', error);
      res.status(500).json({ error: 'Internal server error' });
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
