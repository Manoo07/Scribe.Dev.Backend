import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

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

    return res.status(201).json({ message: 'College created successfully', college });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const collegeData = await prisma.college.findMany({});
    return res.status(200).json(collegeData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
