// Service for class attendance
import classAttendanceDAO from '../dao/classAttendanceDAO';
import studentDAO from '../dao/studentDAO';

const createAttendance = async (data: any) => {
  // Accepts userIds, fetches studentIds, and bulk inserts attendance
  const { classroomId, students, date, present } = data;
  const attendanceRecords = [];
  for (const userId of students) {
    const student = await studentDAO.getStudentByUserId(userId);
    if (student && student.id) {
      attendanceRecords.push({
        classroomId,
        studentId: student.id,
        date,
        present,
      });
    }
  }
  return await classAttendanceDAO.bulkCreateAttendance(attendanceRecords);
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
