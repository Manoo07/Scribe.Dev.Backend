import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from '../constants/constants';
import { logger } from '../services/logService';

const prisma = new PrismaClient();
const router = Router();

router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { name, collegeId } = req.body;

  try {
    // Validate if the college existsa
    const collegeExists = await prisma.college.findUnique({
      where: { id: collegeId },
    });

    if (!collegeExists) {
      return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Invalid collegeId: No such college exists.' });
    }

    // Create the department
    const department = await prisma.department.create({
      data: {
        name,
        collegeId,
      },
    });

    return res.status(HTTP_STATUS_CREATED).json(department);
  } catch (error) {
    logger.error('Error creating department:', error);
    return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        college: true, // Include college details if needed
      },
    });

    return res.status(HTTP_STATUS_OK).json(departments);
  } catch (error) {
    logger.error('Error fetching departments:', error);
    return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    const department = await prisma.department.findUnique({
      where: { id },
      include: { college: true }, // Include related college details
    });

    if (!department) {
      return res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Department not found' });
    }

    return res.status(HTTP_STATUS_OK).json(department);
  } catch (error) {
    logger.error('Error fetching department:', error);
    return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { name, collegeId } = req.body;

  try {
    // Check if department exists
    const departmentExists = await prisma.department.findUnique({
      where: { id },
    });

    if (!departmentExists) {
      return res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Department not found' });
    }

    // Update department
    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: {
        name,
        collegeId,
      },
    });

    return res.status(HTTP_STATUS_OK).json(updatedDepartment);
  } catch (error) {
    logger.error('Error updating department:', error);
    return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    // Check if department exists
    const departmentExists = await prisma.department.findUnique({
      where: { id },
    });

    if (!departmentExists) {
      return res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Department not found' });
    }

    // Delete department
    await prisma.department.delete({
      where: { id },
    });

    return res.status(HTTP_STATUS_OK).json({ message: 'Department deleted successfully' });
  } catch (error) {
    logger.error('Error deleting department:', error);
    return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

export default router;
