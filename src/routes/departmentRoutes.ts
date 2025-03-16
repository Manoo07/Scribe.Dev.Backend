import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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
      return res.status(400).json({ error: 'Invalid collegeId: No such college exists.' });
    }

    // Create the department
    const department = await prisma.department.create({
      data: {
        name,
        collegeId,
      },
    });

    return res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        college: true, // Include college details if needed
      },
    });

    return res.status(200).json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
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
      return res.status(404).json({ error: 'Department not found' });
    }

    return res.status(200).json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
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
      return res.status(404).json({ error: 'Department not found' });
    }

    // Update department
    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: {
        name,
        collegeId,
      },
    });

    return res.status(200).json(updatedDepartment);
  } catch (error) {
    console.error('Error updating department:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
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
      return res.status(404).json({ error: 'Department not found' });
    }

    // Delete department
    await prisma.department.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
