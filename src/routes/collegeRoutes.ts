import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_OK,
} from '../constants/constants';
import { logger } from '../services/logService';

const router = Router();
const prisma = new PrismaClient();

// Define validation schema using zod
// Move this to middleware for validations
const collegeSchema = z.object({
  name: z.string().min(3, 'College name must be at least 3 characters long'),
});

router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const validatedData = collegeSchema.parse(req.body);
    const college = await prisma.college.create({
      data: {
        name: validatedData.name,
      },
    });

    return res.status(HTTP_STATUS_CREATED).json({ message: 'College created successfully', college });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: error.errors });
    }
    logger.error('Error while creating College', error);
    return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const collegeData = await prisma.college.findMany({});
    return res.status(HTTP_STATUS_OK).json(collegeData);
  } catch (error) {
    logger.error('Error while fecthing Colleges', error);
    return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

export default router;
