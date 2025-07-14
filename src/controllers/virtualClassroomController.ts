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
import { PrismaClient } from '@prisma/client';
import studentDAO from '@dao/studentDAO';
import FacultyDAO from '@dao/facultyDAO';
import { VirtualClassroomDAO } from '@dao/virtualClassroomDAO';
import VirtualClassroomStudentDAO from '@dao/virtualClassroomStudentDAO';
import { validateFilter } from '@utils/prismaFilters';
import {
  classroomIncludeFields,
  virtualClassroomIncludeFields,
  virtualClassroomsIncludeFields,
} from '@utils/prismaIncludes';
import { studentSelectFields, virtualClassroomStudentSelectFields } from '@utils/prismaSelects';
import { EnrolledStudents, StudentWithUser, Student, VirtualClassroomParams } from 'types/express';
import { validateFields } from '@utils/validations/virtualClassroom.schema';
import SectionDAO from '@dao/sectionDAO';

const prisma = new PrismaClient();

export class VirtualClassroomController {
  virtualClassroomService: VirtualClassroomService;
  prisma: PrismaClient;

  constructor() {
    this.virtualClassroomService = new VirtualClassroomService();
    this.prisma = new PrismaClient();
  }

  createClassroom = async (req: Request, res: Response) => {
    logger.info('[VirtualClassroomController] createClassroom started');
    try {
      if (!req.user || !req.user.id) {
        throw new Error('Unauthorized: User ID missing from request.');
      }
      const userId = req.user.id;
      const { name, syllabusUrl, departmentId, yearId }: VirtualClassroomParams = req.body;
      if (
        !validateFields(
          [
            { key: 'User ID', value: userId },
            { key: 'Name', value: name },
            { key: 'Year ID', value: yearId },
          ],
          res,
        )
      ) {
        return;
      }
      // get the sectionId using yearId
      const sectionId = await SectionDAO.getSectionByYearId(yearId);
      if (!sectionId) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({
          message: 'Year Invalid',
        });
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

      logger.info('[VirtualClassroomController] createClassroom completed successfully');
      return res.status(HTTP_STATUS_CREATED).json({ message: 'Virtual classroom created successfully', classroom });
    } catch (error) {
      logger.error('[VirtualClassroomController] Error creating virtual classroom:', error);
      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Failed to create virtual classroom',
        error: (error as Error).message,
      });
    }
  };

  getClassroom = async (req: Request, res: Response) => {
    logger.info('[VirtualClassroomController] getClassroom started');
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
      logger.info('[VirtualClassroomController] getClassroom completed successfully');
      return res.status(HTTP_STATUS_OK).json({ classroom });
    } catch (error) {
      logger.error('[VirtualClassroomController] Error fetching classrooms:', error);
      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Failed to fetch virtual classrooms',
        error: (error as Error).message,
      });
    }
  };

  getClassrooms = async (req: Request, res: Response) => {
    logger.info('[VirtualClassroomController] getClassrooms started');
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

      const classrooms = await this.virtualClassroomService.getAllVirtualClassrooms(
        filter,
        virtualClassroomsIncludeFields,
      );
      logger.info('[VirtualClassroomController] getClassrooms completed successfully');
      return res.status(HTTP_STATUS_OK).json({ classrooms });
    } catch (error) {
      logger.error('[VirtualClassroomController] Error fetching classrooms:', error);
      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Failed to fetch virtual classrooms',
        error: (error as Error).message,
      });
    }
  };

  // TODO Need to make this logic optimze
  getEligibleStudents = async (req: Request, res: Response) => {
    logger.info('[VirtualClassroomController] getEligibleStudents started');
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

      logger.info('[VirtualClassroomController] getEligibleStudents completed successfully');
      res.status(HTTP_STATUS_OK).json(eligibleStudents);
    } catch (error) {
      logger.error('[VirtualClassroomController] Error fetching eligible students:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  getEnrolledStudents = async (req: Request, res: Response) => {
    logger.info('[VirtualClassroomController] getEnrolledStudents started');
    try {
      const classroomId = req.params.id;
      logger.info(`GetEnrolledStudents : Fetched ClassroomId ${classroomId}`);

      const enrolledStudents = (await VirtualClassroomDAO.getAll({
        filter: { id: classroomId },
        include: virtualClassroomIncludeFields,
      })) as EnrolledStudents[];

      const flattenedStudents = enrolledStudents.flatMap((vc) =>
        vc.virtualClassroomStudents.map((vcs: { student: Student }) => ({
          id: vcs.student.id,
          enrollmentNo: vcs.student.enrollmentNo,
          createdAt: vcs.student.createdAt,
          updatedAt: vcs.student.updatedAt,
          firstName: vcs.student.user.firstName,
          lastName: vcs.student.user.lastName,
          email: vcs.student.user.email,
          userId: vcs.student.user.id,
        })),
      );

      logger.info('[VirtualClassroomController] getEnrolledStudents completed successfully');
      res.status(HTTP_STATUS_OK).json(flattenedStudents);
    } catch (error) {
      logger.error('[VirtualClassroomController] Error fetching enrolled students:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };

  joinClassroom = async (req: Request, res: Response) => {
    logger.info('[VirtualClassroomController] joinClassroom started');
    try {
      const { classroomId, userId } = await req.body;
      if (!userId) {
        throw new Error('Unauthorized: User ID missing from request.');
      }
      logger.info(`[VirtualClassroomController] User ID: ${userId}`);
      logger.info(`[VirtualClassroomController] Classroom ID: ${classroomId}`);

      if (
        !validateFields(
          [
            { key: 'User ID', value: userId },
            { key: 'Classroom ID', value: classroomId },
          ],
          res,
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
      logger.info('[VirtualClassroomController] joinClassroom completed successfully');
      return res.status(HTTP_STATUS_OK).json({ message: 'Joined virtual classroom successfully' });
    } catch (error) {
      logger.error('[VirtualClassroomController] Error joining classroom:', error);
      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Failed to join virtual classroom',
        error: (error as Error).message,
      });
    }
  };

  leaveClassroom = async (req: Request, res: Response) => {
    logger.info('[VirtualClassroomController] leaveClassroom started');
    try {
      const { classroomId, userId } = req.body;

      if (!userId) {
        throw new Error('Unauthorized: User ID missing from request.');
      }

      if (
        !validateFields(
          [
            { key: 'User ID', value: userId },
            { key: 'Classroom ID', value: classroomId },
          ],
          res,
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

      logger.info('[VirtualClassroomController] leaveClassroom completed successfully');
      return res.status(HTTP_STATUS_OK).json({ message: 'Left virtual classroom successfully' });
    } catch (error) {
      logger.error('[VirtualClassroomController] Error leaving classroom:', error);
      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Failed to leave virtual classroom',
        error: (error as Error).message,
      });
    }
  };

  deleteClassroom = async (req: Request, res: Response) => {
    logger.info('[VirtualClassroomController] Delete classroom');

    try {
      const { id } = req.params;
      if (!id) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({
          message: 'Classroom ID is missing',
        });
      }

      const classroom = await VirtualClassroomDAO.get({ id });
      if (!classroom) {
        return res.status(HTTP_STATUS_NOT_FOUND).json({
          message: 'Classroom not found',
        });
      }

      await this.virtualClassroomService.deleteVirtualClassroom(id);

      logger.info(`[VirtualClassroomController] Classroom ${id} deleted successfully`);

      return res.status(HTTP_STATUS_OK).json({
        message: 'Classroom deleted successfully',
      });
    } catch (error) {
      logger.error('[VirtualClassroomController] Error deleting classroom:', error);

      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Failed to delete classroom',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
}
