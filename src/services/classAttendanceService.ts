// Service for class attendance
import classAttendanceDAO from '../dao/classAttendanceDAO';
import { PrismaClient } from '@prisma/client';
import VirtualClassroomStudentDAO from '../dao/virtualClassroomStudentDAO';
import studentDAO from '../dao/studentDAO';

const createAttendance = async (data: any) => {
  const prisma = new PrismaClient();
  const { classroomId, students, date, present } = data;
  // Bulk fetch all students by userIds
  const studentRecords = await studentDAO.getStudentsByFilter({ filter: { userId: { in: students } } });
  const studentIdMap = new Map(studentRecords.map(s => [s.userId, s.id]));
  // Get all enrolled students in the classroom
  const enrolled = await VirtualClassroomStudentDAO.getAll({ filter: { classroomId } });
  const enrolledStudentIds = enrolled.map(e => e.studentId);
  // Prepare attendance records
  const presentStudentIds: string[] = students.map((userId: string) => studentIdMap.get(userId)).filter(Boolean);
  const attendanceRecords: { classroomId: string; studentId: string; date: string; present: boolean }[] = [];
  for (const studentId of presentStudentIds) {
    attendanceRecords.push({ classroomId, studentId, date, present: true });
  }
  for (const studentId of enrolledStudentIds) {
    if (!presentStudentIds.includes(studentId)) {
      attendanceRecords.push({ classroomId, studentId, date, present: false });
    }
  }
  // Transaction safety and idempotency
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Remove any existing attendance records for this classroom/date
      await tx.classAttendance.deleteMany({
        where: {
          classroomId,
          date: new Date(date),
        },
      });
      // Bulk insert
      await tx.classAttendance.createMany({ data: attendanceRecords });
      return { success: true, count: attendanceRecords.length };
    });
    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error('Failed to record attendance: ' + errorMsg);
  }
};

const getAttendance = async (id: string) => {
  return await classAttendanceDAO.getAttendance(id);
};

const updateAttendance = async (id: string, data: any) => {
  return await classAttendanceDAO.updateAttendance(id, data);
};

const deleteAttendance = async (id: string) => {
  return await classAttendanceDAO.deleteAttendance(id);
};

export default {
  createAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance,
};
