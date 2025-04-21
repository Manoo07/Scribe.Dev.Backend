import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from '@constants/constants';
import { logger } from '@services/logService';

const prisma = new PrismaClient();
const router = Router();

router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { name, departmentId } = req.body;

  try {
    // Validate if the department exists
    const departmentExists = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!departmentExists) {
      return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Invalid departmentId: No such department exists.' });
    }

    // Create the year
    const year = await prisma.year.create({
      data: {
        name,
        departmentId,
      },
    });

    return res.status(HTTP_STATUS_CREATED).json(year);
  } catch (error) {
    logger.error('Error creating year:', error);
    return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

// ✅ Get all years
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const years = await prisma.year.findMany({
      include: {
        department: true, // Include department details
      },
    });

    return res.status(HTTP_STATUS_OK).json(years);
  } catch (error) {
    logger.error('Error fetching years:', error);
    return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

// ✅ Get year by ID
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    const year = await prisma.year.findUnique({
      where: { id },
      include: { department: true }, // Include department details
    });

    if (!year) {
      return res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Year not found' });
    }

    return res.status(HTTP_STATUS_OK).json(year);
  } catch (error) {
    logger.error('Error fetching year:', error);
    return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

// ✅ Update year
router.put('/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { name, departmentId } = req.body;

  try {
    // Check if year exists
    const yearExists = await prisma.year.findUnique({
      where: { id },
    });

    if (!yearExists) {
      return res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Year not found' });
    }

    // Update year
    const updatedYear = await prisma.year.update({
      where: { id },
      data: {
        name,
        departmentId,
      },
    });

    return res.status(HTTP_STATUS_OK).json(updatedYear);
  } catch (error) {
    logger.error('Error updating year:', error);
    return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    // Check if year exists
    const yearExists = await prisma.year.findUnique({
      where: { id },
    });

    if (!yearExists) {
      return res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Year not found' });
    }

    // Delete year
    await prisma.year.delete({
      where: { id },
    });

    return res.status(HTTP_STATUS_OK).json({ message: 'Year deleted successfully' });
  } catch (error) {
    logger.error('Error deleting year:', error);
    return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

export default router;
