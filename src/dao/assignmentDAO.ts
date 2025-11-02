import { PrismaClient } from '@prisma/client';
import { logger } from '@services/logService';

const prisma = new PrismaClient();

const AssignmentDAO = {
  async create(data: any) {
    logger.info('[AssignmentDAO] Creating assignment');
    try {
  const { classroom, classroomId, facultyId, ...rest } = data;
  const assignmentData: any = {
        ...rest,
      };

      const incomingDeadline = rest.deadline ?? data.deadline;
      logger.info('[AssignmentDAO] parsed incomingDeadline:', incomingDeadline);
      if (incomingDeadline === undefined || incomingDeadline === null) {
        throw new Error('deadline is required');
      }
      const parsedDeadline = new Date(incomingDeadline);
      if (isNaN(parsedDeadline.getTime())) {
        throw new Error('deadline is invalid');
      }
      assignmentData.deadline = parsedDeadline;
      if (classroomId) {
        assignmentData.classroom = { connect: { id: classroomId } };
      }
      if (facultyId) {
        assignmentData.faculty = { connect: { id: facultyId } };
      }
      const assignment = await prisma.assignment.create({ data: assignmentData });
      return assignment;
    } catch (error) {
      logger.error('[AssignmentDAO] Error creating assignment:', error);
      throw error;
    }
  },

  async findByFaculty(facultyId: string, filter: any = {}) {
    logger.info('[AssignmentDAO] Fetching assignments for faculty', facultyId);
    try {
      const assignments = await prisma.assignment.findMany({
        where: { facultyId, ...filter },
        include: {
          classroom: {
            include: {
              _count: { select: { virtualClassroomStudents: true } },
            },
          },
          _count: { select: { assignmentSubmissions: true } },
        },
      });
      return assignments;
    } catch (error) {
      logger.error('[AssignmentDAO] Error fetching assignments:', error);
      throw error;
    }
  },

  async findSubmissions(assignmentId: string, filter: any = {}) {
    logger.info('[AssignmentDAO] Fetching submissions for assignment', assignmentId);
    try {
      const submissions = await prisma.assignmentSubmission.findMany({
        where: { assignmentId, ...filter },
        include: {
          student: { include: { user: true } },
          assignment: {
            include: {
              classroom: { include: { _count: { select: { virtualClassroomStudents: true } } } },
              _count: { select: { assignmentSubmissions: true } },
            },
          },
        },
      });
      return submissions;
    } catch (error) {
      logger.error('[AssignmentDAO] Error fetching submissions:', error);
      throw error;
    }
  },

  async reviewSubmission(submissionId: string, data: any) {
    logger.info('[AssignmentDAO] Reviewing submission', submissionId);
    try {
      const updatedAssignment = await prisma.assignmentSubmission.update({ where: { id: submissionId }, data });
      return updatedAssignment;
    } catch (error) {
      logger.error('[AssignmentDAO] Error reviewing submission:', error);
      throw error;
    }
  },

  async delete(assignmentId: string, facultyId: string) {
    logger.info('[AssignmentDAO] Deleting assignment', assignmentId);
    try {
      const existing = await prisma.assignment.findUnique({ where: { id: assignmentId } });
      if (!existing) throw new Error('Assignment not found');
      if (existing.facultyId !== facultyId) throw new Error('Forbidden');
      await prisma.assignment.delete({ where: { id: assignmentId } });
      return { success: true };
    } catch (error) {
      logger.error('[AssignmentDAO] Error deleting assignment:', error);
      throw error;
    }
  },

  async update(assignmentId: string, facultyId: string, data: any) {
    logger.info('[AssignmentDAO] Updating assignment', assignmentId);
    try {
      const existing = await prisma.assignment.findUnique({ where: { id: assignmentId } });
      if (!existing) throw new Error('Assignment not found');
      if (existing.facultyId !== facultyId) throw new Error('Forbidden');
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.noteContent !== undefined) updateData.noteContent = data.noteContent;
      if (data.questionFileUrl !== undefined) updateData.questionFileUrl = data.questionFileUrl;
      if (data.deadline !== undefined && data.deadline !== null) {
        const parsed = new Date(data.deadline);
        if (isNaN(parsed.getTime())) throw new Error('Invalid deadline');
        updateData.deadline = parsed;
      }
      if (data.classroomId) updateData.classroom = { connect: { id: data.classroomId } };
      const updated = await prisma.assignment.update({ where: { id: assignmentId }, data: updateData });
      return updated;
    } catch (error) {
      logger.error('[AssignmentDAO] Error updating assignment:', error);
      throw error;
    }
  },

  async createSubmission(assignmentId: string, studentId: string, fileUrlOrData: string | { submissionFileUrl?: string; content?: string }) {
    logger.info('[AssignmentDAO] Creating submission for assignment', assignmentId);
    try {
      const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
      if (!assignment) throw new Error('Assignment not found');
      const submittedAt = new Date();
      const status = assignment.deadline && submittedAt <= assignment.deadline ? 'SUBMITTED' : 'OVERDUE';
      const student = await prisma.student.findUnique({ where: { userId: studentId } });
      if (!student) throw new Error('Student not found');
      let content = '';
      let submissionFileUrl: string | null = null;
      if (typeof fileUrlOrData === 'string') {
        submissionFileUrl = fileUrlOrData;
      } else if (fileUrlOrData && typeof fileUrlOrData === 'object') {
        content = fileUrlOrData.content ?? '';
        submissionFileUrl = fileUrlOrData.submissionFileUrl ?? null;
      }
      const submission = await prisma.assignmentSubmission.create({ data: { assignmentId, studentId: student.id, content, submissionFileUrl, status, submittedAt } });
      if (assignment.deadline && submittedAt <= assignment.deadline) {
        await prisma.assignment.update({
          where: { id: assignmentId },
          data: { status: 'OPEN' }
        });
        logger.info('[AssignmentDAO] Assignment status set to OPEN after submission before deadline', assignmentId);
      } else if (assignment.deadline && submittedAt > assignment.deadline) {
        logger.info('[AssignmentDAO] Submission after deadline, assignment status not changed to OPEN', assignmentId);
      }
      
      return submission;
    } catch (error) {
      logger.error('[AssignmentDAO] Error creating submission:', error);
      throw error;
    }
  },

  async updateSubmission(submissionId: string, studentId: string, fileUrlOrData: string | { submissionFileUrl?: string; content?: string }) {
    logger.info('[AssignmentDAO] Updating submission', submissionId);
    try {
      const existing = await prisma.assignmentSubmission.findUnique({ where: { id: submissionId } });
      if (!existing) throw new Error('Submission not found');
      const student = await prisma.student.findUnique({ where: { userId: studentId } });
      if (!student) throw new Error('Student not found');
      if (existing.studentId !== student.id) throw new Error('Forbidden');
      
      if (existing.status === 'ACCEPTED' || existing.status === 'REJECTED') {
        throw new Error('Cannot edit a reviewed submission');
      }
      const assignment = await prisma.assignment.findUnique({ where: { id: existing.assignmentId } });
      const submittedAt = new Date();
      const status = assignment && assignment.deadline && submittedAt <= assignment.deadline ? 'SUBMITTED' : 'OVERDUE';
      const dataToUpdate: any = { submittedAt, status };
      if (typeof fileUrlOrData === 'string') {
        dataToUpdate.submissionFileUrl = fileUrlOrData;
      } else if (fileUrlOrData && typeof fileUrlOrData === 'object') {
        if (fileUrlOrData.submissionFileUrl !== undefined) dataToUpdate.submissionFileUrl = fileUrlOrData.submissionFileUrl;
        if (fileUrlOrData.content !== undefined) dataToUpdate.content = fileUrlOrData.content;
      }
      const updated = await prisma.assignmentSubmission.update({ where: { id: submissionId }, data: dataToUpdate });
      
      // When a student resubmits (updates their submission), set assignment status back to OPEN
      // This allows faculty to review the resubmission, but only if submitted before deadline
      if (assignment && assignment.deadline && submittedAt <= assignment.deadline) {
        await prisma.assignment.update({
          where: { id: existing.assignmentId },
          data: { status: 'OPEN' }
        });
        logger.info('[AssignmentDAO] Assignment status set to OPEN after resubmission before deadline', existing.assignmentId);
      } else if (assignment && assignment.deadline && submittedAt > assignment.deadline) {
        logger.info('[AssignmentDAO] Resubmission after deadline, assignment status not changed to OPEN', existing.assignmentId);
      }
      
      return updated;
    } catch (error) {
      logger.error('[AssignmentDAO] Error updating submission:', error);
      throw error;
    }
  },

  async findByStudent(studentId: string) {
    logger.info('[AssignmentDAO] Fetching submissions for student', studentId);
    try {
      // studentId passed is User.id; map to Student.id
      const student = await prisma.student.findUnique({ where: { userId: studentId } });
      if (!student) return [];
      const submissions = await prisma.assignmentSubmission.findMany({
        where: { studentId: student.id },
        include: {
          assignment: {
            include: {
              classroom: { include: { _count: { select: { virtualClassroomStudents: true } } } },
              _count: { select: { assignmentSubmissions: true } },
            },
          },
        },
      });
      return submissions;
    } catch (error) {
      logger.error('[AssignmentDAO] Error fetching student submissions:', error);
      throw error;
    }
  },

  async findByStudentAndAssignment(studentUserId: string, assignmentId: string) {
    logger.info('[AssignmentDAO] Fetching submissions for student and assignment', studentUserId, assignmentId);
    try {
      const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
      if (!student) return [];
      const submissions = await prisma.assignmentSubmission.findMany({
        where: { studentId: student.id, assignmentId },
        include: {
          assignment: {
            include: {
              classroom: { include: { _count: { select: { virtualClassroomStudents: true } } } },
              _count: { select: { assignmentSubmissions: true } },
            },
          },
        },
      });
      return submissions;
    } catch (error) {
      logger.error('[AssignmentDAO] Error fetching student submissions for assignment:', error);
      throw error;
    }
  },

  async deleteSubmission(submissionId: string, studentId: string) {
    logger.info('[AssignmentDAO] Deleting submission', submissionId);
    try {
      const existing = await prisma.assignmentSubmission.findUnique({ where: { id: submissionId } });
      if (!existing) throw new Error('Submission not found');
      const student = await prisma.student.findUnique({ where: { userId: studentId } });
      if (!student) throw new Error('Student not found');
      if (existing.studentId !== student.id) throw new Error('Forbidden');
      // Only allow deletion if not reviewed yet (status is PENDING or SUBMITTED or OVERDUE)
      if (existing.status === 'ACCEPTED' || existing.status === 'REJECTED') {
        throw new Error('Cannot delete a reviewed submission');
      }
      await prisma.assignmentSubmission.delete({ where: { id: submissionId } });
      return { success: true };
    } catch (error) {
      logger.error('[AssignmentDAO] Error deleting submission:', error);
      throw error;
    }
  },
};

export default AssignmentDAO;
