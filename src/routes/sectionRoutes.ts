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

// ✅ Create a new section
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { name, yearId } = req.body;

  try {
    // Validate if the year exists
    const yearExists = await prisma.year.findUnique({
      where: { id: yearId },
    });

    if (!yearExists) {
      return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Invalid yearId: No such year exists.' });
    }

    // Create the section
    const section = await prisma.section.create({
      data: {
        name,
        yearId,
      },
    });

    return res.status(HTTP_STATUS_CREATED).json(section);
  } catch (error) {
    logger.error('Error creating section:', error);
    return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
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

    return res.status(HTTP_STATUS_OK).json(sections);
  } catch (error) {
    logger.error('Error fetching sections:', error);
    return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
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
      return res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Section not found' });
    }

    return res.status(HTTP_STATUS_OK).json(section);
  } catch (error) {
    logger.error('Error fetching section:', error);
    return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
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
      return res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Section not found' });
    }

    // Update section
    const updatedSection = await prisma.section.update({
      where: { id },
      data: {
        name,
        yearId,
      },
    });

    return res.status(HTTP_STATUS_OK).json(updatedSection);
  } catch (error) {
    logger.error('Error updating section:', error);
    return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
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
      return res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Section not found' });
    }

    // Delete section
    await prisma.section.delete({
      where: { id },
    });

    return res.status(HTTP_STATUS_OK).json({ message: 'Section deleted successfully' });
  } catch (error) {
    logger.error('Error deleting section:', error);
    return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

export default router;
