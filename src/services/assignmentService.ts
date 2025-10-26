import AssignmentDAO from '@dao/assignmentDAO';
import { logger } from './logService';
import { Assignment } from '@prisma/client';
import { deleteAssignment } from '@controllers/assignmentController';

class AssignmentService {
  async createAssignment(data: any): Promise<{ assignment?: Assignment; error?: string }> {
    try {
      const assignment = await AssignmentDAO.create(data);
      return { assignment };
    } catch (error) {
      logger.error('[AssignmentService] Error creating assignment:', error);
      return { error: 'Failed to create assignment' };
    }
  }

  async getAssignmentsByFaculty(facultyId: string, filter: any = {}): Promise<Assignment[]> {
    return AssignmentDAO.findByFaculty(facultyId, filter);
  }

  async deleteAssignment(assignmentId: string, facultyId: string): Promise<{ success?: boolean; error?: string }> {
    try {
      const res = await AssignmentDAO.delete(assignmentId, facultyId);
      return { success: res.success };
    } catch (error) {
      logger.error('[AssignmentService] Error deleting assignment:', error);
      return { error: String(error) };
    }
  }

  async updateAssignment(assignmentId: string, facultyId: string, data: any): Promise<{ assignment?: any; error?: string }> {
    try {
      const assignment = await (AssignmentDAO as any).update(assignmentId, facultyId, data);
      return { assignment };
    } catch (error) {
      logger.error('[AssignmentService] Error updating assignment:', error);
      return { error: 'Failed to update assignment' };
    }
  }


  async getSubmissions(assignmentId: string, filter: any = {}): Promise<any[]> {
    return AssignmentDAO.findSubmissions(assignmentId, filter);
  }

  async getAssignmentsForStudent(studentId: string, filter: any = {}): Promise<any[]> {
    // Fetch all assignments (could be filtered by classroom/section) and annotate with student's submission status
    const assignments = await AssignmentDAO.findByFaculty(undefined as any, filter);
    const subs = await AssignmentDAO.findByStudent(studentId);
    const subMap = new Map(subs.map((s: any) => [s.assignmentId, s]));
    return assignments.map((a: any) => {
      const s = subMap.get(a.id);
      return {
        ...a,
        studentStatus: s ? s.status : 'OPEN',
        submission: s || null,
      };
    });
  }

  async createSubmission(
    assignmentId: string,
    studentId: string,
    fileUrlOrData: string | { submissionFileUrl?: string; content?: string },
  ): Promise<{ submission?: any; error?: string }> {
    try {
      const submission = await AssignmentDAO.createSubmission(assignmentId, studentId, fileUrlOrData as any);
      return { submission };
    } catch (error) {
      logger.error('[AssignmentService] Error creating submission:', error);
      return { error: 'Failed to create submission' };
    }
  }

  async updateSubmission(
    submissionId: string,
    studentId: string,
    fileUrlOrData: string | { submissionFileUrl?: string; content?: string },
  ): Promise<{ updated?: any; error?: string }> {
    try {
      const updatedAssignment = await AssignmentDAO.updateSubmission(submissionId, studentId, fileUrlOrData as any);
      return { updated: updatedAssignment };
    } catch (error) {
      logger.error('[AssignmentService] Error updating submission:', error);
      return { error: 'Failed to update submission' };
    }
  }

  async getSubmissionsByStudent(studentId: string): Promise<any[]> {
    return AssignmentDAO.findByStudent(studentId);
  }

  async getSubmissionsForStudentAssignment(studentId: string, assignmentId: string): Promise<any[]> {
    return (AssignmentDAO as any).findByStudentAndAssignment(studentId, assignmentId);
  }

  async deleteSubmission(submissionId: string, studentId: string): Promise<{ success?: boolean; error?: string }> {
    try {
      const res = await AssignmentDAO.deleteSubmission(submissionId, studentId);
      return { success: res.success };
    } catch (error) {
      logger.error('[AssignmentService] Error deleting submission:', error);
      return { error: String(error) };
    }
  }

  async reviewSubmission(submissionId: string, data: any): Promise<{ updated?: any; error?: string }> {
    try {
      const updatedSubmission = await AssignmentDAO.reviewSubmission(submissionId, data);
      return { updated: updatedSubmission };
    } catch (error) {
      logger.error('[AssignmentService] Error reviewing submission:', error);
      return { error: 'Failed to review submission' };
    }
  }
}

export default AssignmentService;
