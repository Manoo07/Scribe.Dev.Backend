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
  HTTP_STATUS_FORBIDDEN,
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
        // Try faculty first, but handle errors gracefully
        let faculty = null;
        try {
          faculty = await FacultyDAO.getFacultyByUserId(userId);
        } catch (e) {
          faculty = null;
        }
        if (faculty && faculty.id) {
          filter = { facultyId: faculty.id };
        } else {
          // If not faculty, try student
          let student = null;
          try {
            student = await studentDAO.getStudentByUserId(userId);
          } catch (e) {
            student = null;
          }
          if (student && student.id) {
            filter = { studentId: student.id };
          } else {
            return res.status(HTTP_STATUS_BAD_REQUEST).json({ message: 'User is neither faculty nor student' });
          }
        }
      }

      if (filter) {
        let filterForValidation = filter;
        if ('studentId' in filter) {
          const { studentId, ...rest } = filter;
          filterForValidation = rest;
        }
        const invalidKeys = validateFilter(filterForValidation);
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
      if (filter && 'studentId' in filter) {
        if (!classrooms || classrooms.length === 0) {
          logger.info(`[VirtualClassroomController] Student ${filter.studentId} is not enrolled in any classrooms.`);
        } else {
          logger.info(
            `[VirtualClassroomController] Found ${classrooms.length} classrooms for student ${filter.studentId}`,
          );
        }
      }
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
      const actingUser = req.user;
      if (!actingUser || !actingUser.id) {
        throw new Error('Unauthorized: User ID missing from request.');
      }
      logger.info(`[VirtualClassroomController] Acting User ID: ${actingUser.id}`);
      logger.info(`[VirtualClassroomController] Classroom ID: ${classroomId}`);
      logger.info(`[VirtualClassroomController] Target User ID (to add): ${userId}`);

      // Only allow FACULTY or ADMIN/PRINCIPAL to add students
      const userRole = actingUser.role;
      if (!userRole || (userRole !== 'FACULTY' && userRole !== 'ADMIN' && userRole !== 'PRINCIPAL')) {
        return res
          .status(HTTP_STATUS_FORBIDDEN)
          .json({ message: 'Only faculty or admin/principal can add students to a classroom.' });
      }

      // Validate input fields
      if (
        !validateFields(
          [
            { key: 'User ID', value: actingUser.id },
            { key: 'Classroom ID', value: classroomId },
            { key: 'Target User ID', value: userId },
          ],
          res,
        )
      ) {
        return;
      }

      // Only allow adding users who are students
      const student = await studentDAO.getStudentByUserId(userId);
      if (!student?.id) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ message: 'Target user is not a student or does not exist.' });
      }

      const isAlreadyEnrolled = await this.virtualClassroomService.isStudentEnrolled(student.id, classroomId);
      if (isAlreadyEnrolled) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ message: 'Student is already enrolled in the classroom' });
      }

      await this.virtualClassroomService.joinClassroom(student.id, classroomId);
      logger.info('[VirtualClassroomController] joinClassroom completed successfully');
      return res.status(HTTP_STATUS_OK).json({ message: 'Student added to virtual classroom successfully' });
    } catch (error) {
      logger.error('[VirtualClassroomController] Error joining classroom:', error);
      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Failed to add student to virtual classroom',
        error: (error as Error).message,
      });
    }
  };

  leaveClassroom = async (req: Request, res: Response) => {
    logger.info('[VirtualClassroomController] leaveClassroom started');
    try {
      const { classroomId, userId } = req.body;
      const actingUser = req.user;
      if (!actingUser || !actingUser.id) {
        throw new Error('Unauthorized: User ID missing from request.');
      }
      logger.info(`[VirtualClassroomController] Acting User ID: ${actingUser.id}`);
      logger.info(`[VirtualClassroomController] Classroom ID: ${classroomId}`);
      logger.info(`[VirtualClassroomController] Target User ID (to remove): ${userId}`);

      // Only allow FACULTY or ADMIN/PRINCIPAL to remove students
      const userRole = actingUser.role;
      if (!userRole || (userRole !== 'FACULTY' && userRole !== 'ADMIN' && userRole !== 'PRINCIPAL')) {
        return res
          .status(HTTP_STATUS_FORBIDDEN)
          .json({ message: 'Only faculty or admin/principal can remove students from a classroom.' });
      }

      if (
        !validateFields(
          [
            { key: 'User ID', value: actingUser.id },
            { key: 'Classroom ID', value: classroomId },
            { key: 'Target User ID', value: userId },
          ],
          res,
        )
      ) {
        return;
      }

      // Only allow removing users who are students
      const student = await studentDAO.getStudentByUserId(userId);
      if (!student?.id) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ message: 'Target user is not a student or does not exist.' });
      }

      const result = await this.virtualClassroomService.leaveClassroom(student.id, classroomId);
      if (!result) {
        return res
          .status(HTTP_STATUS_INTERNAL_SERVER_ERROR)
          .json({ message: 'Failed to remove student from virtual classroom' });
      }

      logger.info('[VirtualClassroomController] leaveClassroom completed successfully');
      return res.status(HTTP_STATUS_OK).json({ message: 'Student removed from virtual classroom successfully' });
    } catch (error) {
      logger.error('[VirtualClassroomController] Error leaving classroom:', error);
      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Failed to remove student from virtual classroom',
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

  bulkJoinClassroom = async (req: Request, res: Response) => {
    logger.info('[VirtualClassroomController] bulkJoinClassroom started');
    try {
      const { classroomId, userIds } = req.body;
      const actingUser = req.user;
      if (!actingUser || !actingUser.id) {
        throw new Error('Unauthorized: User ID missing from request.');
      }
      logger.info(`[VirtualClassroomController] Acting User ID: ${actingUser.id}`);
      logger.info(`[VirtualClassroomController] Classroom ID: ${classroomId}`);
      logger.info(`[VirtualClassroomController] Target User IDs (to add): ${userIds}`);

      // Only allow FACULTY or ADMIN/PRINCIPAL to add students
      const userRole = actingUser.role;
      if (!userRole || (userRole !== 'FACULTY' && userRole !== 'ADMIN' && userRole !== 'PRINCIPAL')) {
        return res
          .status(HTTP_STATUS_FORBIDDEN)
          .json({ message: 'Only faculty or admin/principal can add students to a classroom.' });
      }

      // Validate input fields
      if (
        !validateFields(
          [
            { key: 'User ID', value: actingUser.id },
            { key: 'Classroom ID', value: classroomId },
            { key: 'Target User IDs', value: userIds },
          ],
          res,
        )
      ) {
        return;
      }

      // Map userIds to studentIds
      const studentIdMap = new Map();
      for (const userId of userIds) {
        const student = await studentDAO.getStudentByUserId(userId);
        if (student?.id) {
          studentIdMap.set(userId, student.id);
        }
      }

      if (studentIdMap.size === 0) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ message: 'No valid student IDs provided' });
      }

      // Check enrollment and enroll students using studentId
      const alreadyEnrolled = [];
      const notEnrolled = [];
      for (const [userId, studentId] of studentIdMap.entries()) {
        const isEnrolled = await this.virtualClassroomService.isStudentEnrolled(studentId, classroomId);
        if (isEnrolled) {
          alreadyEnrolled.push(userId);
        } else {
          notEnrolled.push(userId);
          await this.virtualClassroomService.joinClassroom(studentId, classroomId);
        }
      }

      logger.info('[VirtualClassroomController] bulkJoinClassroom completed successfully');
      return res.status(HTTP_STATUS_OK).json({
        message: 'Students processed successfully',
        alreadyEnrolled,
        notEnrolled,
      });
    } catch (error) {
      logger.error('[VirtualClassroomController] Error in bulkJoinClassroom:', error);
      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Failed to process bulk join',
        error: (error as Error).message,
      });
    }
  };

  bulkLeaveClassroom = async (req: Request, res: Response) => {
    logger.info('[VirtualClassroomController] bulkLeaveClassroom started');
    try {
      const { classroomId, userIds } = req.body;
      const actingUser = req.user;
      if (!actingUser || !actingUser.id) {
        throw new Error('Unauthorized: User ID missing from request.');
      }
      logger.info(`[VirtualClassroomController] Acting User ID: ${actingUser.id}`);
      logger.info(`[VirtualClassroomController] Classroom ID: ${classroomId}`);
      logger.info(`[VirtualClassroomController] Target User IDs (to remove): ${userIds}`);

      // Only allow FACULTY or ADMIN/PRINCIPAL to remove students
      const userRole = actingUser.role;
      if (!userRole || (userRole !== 'FACULTY' && userRole !== 'ADMIN' && userRole !== 'PRINCIPAL')) {
        return res
          .status(HTTP_STATUS_FORBIDDEN)
          .json({ message: 'Only faculty or admin/principal can remove students from a classroom.' });
      }

      if (
        !validateFields(
          [
            { key: 'User ID', value: actingUser.id },
            { key: 'Classroom ID', value: classroomId },
            { key: 'Target User IDs', value: userIds },
          ],
          res,
        )
      ) {
        return;
      }

      // Map userIds to studentIds
      const studentIdMap = new Map();
      for (const userId of userIds) {
        const student = await studentDAO.getStudentByUserId(userId);
        if (student?.id) {
          studentIdMap.set(userId, student.id);
        }
      }

      if (studentIdMap.size === 0) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ message: 'No valid student IDs provided' });
      }

      // Check enrollment and unenroll students using studentId
      const enrolled = [];
      const notEnrolled = [];
      for (const [userId, studentId] of studentIdMap.entries()) {
        const isEnrolled = await this.virtualClassroomService.isStudentEnrolled(studentId, classroomId);
        if (isEnrolled) {
          enrolled.push(userId);
          await this.virtualClassroomService.leaveClassroom(studentId, classroomId);
        } else {
          notEnrolled.push(userId);
        }
      }

      logger.info('[VirtualClassroomController] bulkLeaveClassroom completed successfully');
      return res.status(HTTP_STATUS_OK).json({
        message: 'Students processed successfully',
        enrolled,
        notEnrolled,
      });
    } catch (error) {
      logger.error('[VirtualClassroomController] Error in bulkLeaveClassroom:', error);
      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
        message: 'Failed to process bulk leave',
        error: (error as Error).message,
      });
    }
  };
}

// In your main server file (e.g., app.ts or server.ts)
// import virtualClassroomRoutes from 'path-to-your-routes-file';
// app.use('/api/v1/virtual-classrooms', virtualClassroomRoutes);
