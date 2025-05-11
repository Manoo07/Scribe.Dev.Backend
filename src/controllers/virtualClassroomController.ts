import { VirtualClassroomService } from '@services/virtualClassroomService';
import { Request, Response } from 'express';
import { logger } from '@services/logService';
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_OK,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_UNAUTHORIZED,
} from '@constants/constants';
import { Prisma, PrismaClient } from '@prisma/client';
import studentDAO from '@dao/studentDAO';
import FacultyDAO from '@dao/facultyDAO';
import { VirtualClassroomDAO } from '@dao/virtualClassroomDAO';
import VirtualClassroomStudentDAO from '@dao/virtualClassroomStudentDAO';
import { validateFilter } from '@utils/prismaFilters';
import { classroomIncludeFields, virtualClassroomIncludeFields } from '@utils/prismaIncludes';
import { studentSelectFields, virtualClassroomStudentSelectFields } from '@utils/prismaSelects';

const prisma = new PrismaClient();

type StudentWithUser = {
  id: string;
  userId: string;
  enrollmentNo: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

type EnrolledStudents = Prisma.VirtualClassroomGetPayload<{
  include: {
    virtualClassroomStudents: {
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true;
                firstName: true;
                lastName: true;
                email: true;
              };
            };
          };
        };
      };
    };
  };
}>;

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

  // Create Virtual Classroom
  createClassroom = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.id) {
        throw new Error('Unauthorized: User ID missing from request.');
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

  // Get Virtual Classroom with Filters
  getClassroom = async (req: Request, res: Response) => {
    try {
      const { filter } = req.body;
      if (filter) {
        const invalidKeys = validateFilter(filter);
        if (invalidKeys.length > 0) {
          return res.status(HTTP_STATUS_BAD_REQUEST).json({
            message: `Invalid filter field(s): ${invalidKeys.join(', ')}`,
          });
        }
      }

      const classroom = await this.virtualClassroomService.getVirtualClassroom(filter);
      return res.status(HTTP_STATUS_OK).json({ classroom });
    } catch (error) {
      logger.error('[VirtualClassroomController] Error fetching classrooms:', error);
      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Failed to fetch virtual classrooms',
        error: (error as Error).message,
      });
    }
  };

  // Get All Virtual Classrooms
  getClassrooms = async (req: Request, res: Response) => {
    try {
      let { filter } = req.body;
      if (!filter) {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(HTTP_STATUS_UNAUTHORIZED).json({ message: 'User unauthorized' });
        }
        const faculty = await FacultyDAO.getFacultyByUserId(userId);
        filter = { facultyId: faculty.id };
      }

      if (filter) {
        const invalidKeys = validateFilter(filter);
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

  // Get Eligible Students
  getEligibleStudents = async (req: Request, res: Response) => {
    try {
      const classroomId = req.params.id;

      const classroom = await VirtualClassroomDAO.get({ id: classroomId }, classroomIncludeFields);
      if (!classroom) {
        return res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Classroom not found' });
      }

      const sectionId = classroom.sectionId;
      const enrolledStudents = await VirtualClassroomStudentDAO.getAll({
        filter: { classroomId },
        select: virtualClassroomStudentSelectFields,
      });

      const enrolledStudentIds = enrolledStudents.map((e) => e.studentId);

      const studentFilter = {
        id: { notIn: enrolledStudentIds },
        user: {
          userRole: {
            sectionId: sectionId,
          },
        },
      };

      const eligibleStudentsRaw = (await studentDAO.getStudentsByFilter({
        filter: studentFilter,
        select: studentSelectFields,
      })) as StudentWithUser[];

      const eligibleStudents = eligibleStudentsRaw.map((student) => ({
        ...student,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        userId: student.user.id,
      }));

      res.status(200).json(eligibleStudents);
    } catch (error) {
      logger.error('Error fetching eligible students:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  // Get Enrolled Students
  getEnrolledStudents = async (req: Request, res: Response) => {
    try {
      const classroomId = req.params.id;
      logger.info(`GetEligibleStudents : Fetched ClassroomId ${classroomId}`);

      // Call the get method with filter and include
      const enrolledStudents = (await VirtualClassroomDAO.getAll({
        filter: { id: classroomId },
        include: virtualClassroomIncludeFields,
      })) as EnrolledStudents[];

      // Map the enrolled students to the flattened structure
      const flattenedStudents = enrolledStudents.flatMap((vc) =>
        vc.virtualClassroomStudents.map((vcs) => ({
          id: vcs.student.id,
          enrollmentNo: vcs.student.enrollmentNo,
          createdAt: vcs.student.createdAt,
          updatedAt: vcs.student.updatedAt,
          firstName: vcs.student.user.firstName,
          lastName: vcs.student.user.lastName,
          email: vcs.student.user.email,
          userId: vcs.student.user.id,
        }))
      );

      logger.info(`GetEligibleStudents : Fetched enrolled students ${JSON.stringify(flattenedStudents)}`);
      res.status(HTTP_STATUS_OK).json(flattenedStudents);
    } catch (error) {
      logger.error('Error fetching eligible students:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  // Join Virtual Classroom
  joinClassroom = async (req: Request, res: Response) => {
    try {
      const { classroomId } = await req.body;
      if (!req.user || !req.user.id) {
        throw new Error('Unauthorized: User ID missing from request.');
      }
      const userId = req.user?.id;
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

      const student = await studentDAO.getStudentByUserId(userId);
      if (!student?.id) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ message: 'Student not found for the given User ID' });
      }

      const isAlreadyEnrolled = await this.virtualClassroomService.isStudentEnrolled(student.id, classroomId);
      if (isAlreadyEnrolled) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ message: 'Student is already enrolled in the classroom' });
      }

      await this.virtualClassroomService.joinClassroom(student.id, classroomId);
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
        throw new Error('Unauthorized: User ID missing from request.');
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

      const student = await studentDAO.getStudentByUserId(userId);
      if (!student?.id) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ message: 'Student not found for the given User ID' });
      }

      const result = await this.virtualClassroomService.leaveClassroom(student.id, classroomId);
      if (!result) {
        return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ message: 'Failed to leave virtual classroom' });
      }

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
