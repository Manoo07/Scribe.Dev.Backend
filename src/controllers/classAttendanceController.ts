// Controller for class attendance

import { Request, Response } from 'express';
import FacultyDAO from '../dao/facultyDAO';
import studentDAO from '../dao/studentDAO';
import { VirtualClassroomDAO } from '../dao/virtualClassroomDAO';
import { ClassAttendanceRequestSchema, ClassAttendanceRequestDTO } from '../types/classAttendance';
import classAttendanceService from '../services/classAttendanceService';

export const createAttendance = async (req: Request, res: Response) => {
  try {
    // Validate request body using zod
    const parseResult = ClassAttendanceRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors });
    }
    const body: ClassAttendanceRequestDTO = parseResult.data;

    // Auth validation
    const facultyUserId = req.user?.id;
    if (!facultyUserId) {
      return res.status(401).json({ error: 'Unauthorized: No user found' });
    }

    // Delegate all business logic to service
    const result = await classAttendanceService.createAttendance({ ...body, facultyUserId });
    res.status(201).json(result);
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
