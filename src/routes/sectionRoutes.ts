import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// ✅ Create a new section
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { name, yearId } = req.body;

  try {
    // Validate if the year exists
    const yearExists = await prisma.year.findUnique({
      where: { id: yearId },
    });

    if (!yearExists) {
      return res.status(400).json({ error: 'Invalid yearId: No such year exists.' });
    }

    // Create the section
    const section = await prisma.section.create({
      data: {
        name,
        yearId,
      },
    });

    return res.status(201).json(section);
  } catch (error) {
    console.error('Error creating section:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ Get all sections
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const sections = await prisma.section.findMany({
      include: {
        year: true, // Include year details if needed
      },
    });

    return res.status(200).json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ Get section by ID
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    const section = await prisma.section.findUnique({
      where: { id },
      include: { year: true }, // Include related year details
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    return res.status(200).json(section);
  } catch (error) {
    console.error('Error fetching section:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ Update section
router.put('/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { name, yearId } = req.body;

  try {
    // Check if section exists
    const sectionExists = await prisma.section.findUnique({
      where: { id },
    });
    

    if (!sectionExists) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Update section
    const updatedSection = await prisma.section.update({
      where: { id },
      data: {
        name,
        yearId,
      },
    });

    return res.status(200).json(updatedSection);
  } catch (error) {
    console.error('Error updating section:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ Delete section
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    // Check if section exists
    const sectionExists = await prisma.section.findUnique({
      where: { id },
    });

    if (!sectionExists) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Delete section
    await prisma.section.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
