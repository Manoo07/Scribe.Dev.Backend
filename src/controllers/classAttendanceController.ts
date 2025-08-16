// Controller for class attendance

import { Request, Response } from 'express';
import FacultyDAO from '../dao/facultyDAO';
import studentDAO from '../dao/studentDAO';
import { VirtualClassroomDAO } from '../dao/virtualClassroomDAO';
import classAttendanceService from '../services/classAttendanceService';

export const createAttendance = async (req: Request, res: Response) => {
  try {
    // Extract and validate request data
    const facultyUserId = req.user?.id;
    const { classroomId, students, date, present } = req.body;
    if (!facultyUserId) {
      return res.status(401).json({ error: 'Unauthorized: No user found' });
    }

    // Validate faculty
    let faculty;
    try {
      faculty = await FacultyDAO.getFacultyByUserId(facultyUserId);
    } catch {
      return res.status(403).json({ error: 'User is not a faculty' });
    }

    // Validate classroom
    const classroom = await VirtualClassroomDAO.get({ id: classroomId });
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    // Validate students
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'No students provided' });
    }
    const invalidStudents: string[] = [];
    for (const studentId of students) {
      const student = await studentDAO.getStudentByUserId(studentId);
      if (!student) {
        invalidStudents.push(studentId);
      }
    }
    if (invalidStudents.length > 0) {
      return res.status(400).json({ error: `Invalid student IDs: ${invalidStudents.join(', ')}` });
    }

    // All validations passed, create attendance
    const attendance = await classAttendanceService.createAttendance({
      classroomId,
      students,
      date,
      present,
      facultyUserId,
    });
    res.status(201).json(attendance);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: errMsg });
  }
};

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = await classAttendanceService.getAttendance(req.params.id);
    res.status(200).json(attendance);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(404).json({ error: errMsg });
  }
};

export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = await classAttendanceService.updateAttendance(req.params.id, req.body);
    res.status(200).json(attendance);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: errMsg });
  }
};

export const deleteAttendance = async (req: Request, res: Response) => {
  try {
    await classAttendanceService.deleteAttendance(req.params.id);
    res.status(204).send();
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: errMsg });
  }
};
