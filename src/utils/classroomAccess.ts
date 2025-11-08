import { logger } from '@services/logService';

/**
 * Checks if a user is a member of a classroom (as student or faculty)
 * @param userId - The user ID to check
 * @param classroomId - The classroom ID to check membership for
 * @returns true if user is a member, false otherwise
 */
export async function checkClassroomMembership(userId: string, classroomId: string): Promise<boolean> {
  try {
    const [studentDAO, facultyDAO, vClassStudentDAO] = await Promise.all([
      import('@dao/studentDAO'),
      import('@dao/facultyDAO'),
      import('@dao/virtualClassroomStudentDAO'),
    ]);

    let isMember = false;

    // Check student membership
    const student = await studentDAO.default.getStudentByUserId(userId);
    if (student) {
      const membership = await vClassStudentDAO.default.get({ classroomId, studentId: student.id });
      if (membership) {
        isMember = true;
      }
    }

    // Check faculty membership if not already a member
    if (!isMember) {
      try {
        const faculty = await facultyDAO.default.getFacultyByUserId(userId);
        if (faculty && faculty.id) {
          const { VirtualClassroomDAO } = await import('@dao/virtualClassroomDAO');
          const facultyClassroom = await VirtualClassroomDAO.get({ facultyId: faculty.id, id: classroomId });
          if (facultyClassroom) {
            isMember = true;
          }
        }
      } catch (e) {
        // User is not a faculty, continue
      }
    }

    return isMember;
  } catch (error) {
    logger.error('[classroomAccess] checkClassroomMembership error', {
      error: error instanceof Error ? error.message : error,
      userId,
      classroomId,
    });
    throw error;
  }
}
