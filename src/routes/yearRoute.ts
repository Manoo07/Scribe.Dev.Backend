import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// ✅ Create a new year
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { name, departmentId } = req.body;

  try {
    // Validate if the department exists
    const departmentExists = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!departmentExists) {
      return res.status(400).json({ error: 'Invalid departmentId: No such department exists.' });
    }

    // Create the year
    const year = await prisma.year.create({
      data: {
        name,
        departmentId,
      },
    });

    return res.status(201).json(year);
  } catch (error) {
    console.error('Error creating year:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
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

    return res.status(200).json(years);
  } catch (error) {
    console.error('Error fetching years:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
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
      return res.status(404).json({ error: 'Year not found' });
    }

    return res.status(200).json(year);
  } catch (error) {
    console.error('Error fetching year:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
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
      return res.status(404).json({ error: 'Year not found' });
    }

    // Update year
    const updatedYear = await prisma.year.update({
      where: { id },
      data: {
        name,
        departmentId,
      },
    });

    return res.status(200).json(updatedYear);
  } catch (error) {
    console.error('Error updating year:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ Delete year
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    // Check if year exists
    const yearExists = await prisma.year.findUnique({
      where: { id },
    });

    if (!yearExists) {
      return res.status(404).json({ error: 'Year not found' });
    }

    // Delete year
    await prisma.year.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Year deleted successfully' });
  } catch (error) {
    console.error('Error deleting year:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
