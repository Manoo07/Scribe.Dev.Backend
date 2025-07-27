import { HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP_STATUS_NOT_FOUND, HTTP_STATUS_OK } from '@constants/constants';
import { UnitController } from '@controllers/unitController';
import { VirtualClassroomController } from '@controllers/virtualClassroomController';
import { VirtualClassroomDAO } from '@dao/virtualClassroomDAO';
import { logger } from '@services/logService';
import { Request, Response, Router } from 'express';

export const virtualClassroomRouter = Router();
const virtualClassroomController = new VirtualClassroomController();
const unitController = new UnitController();

virtualClassroomRouter.get('/', async (req: Request, res: Response) => {
  try {
    await virtualClassroomController.getClassrooms(req, res);
  } catch (error) {
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ error: 'An error occurred while fetching the classrooms.' });
  }
});

virtualClassroomRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const classroomId = req.params.id;
    const filter = { id: classroomId };

    const classroom = await VirtualClassroomDAO.get(filter);

    if (!classroom) {
      res.status(HTTP_STATUS_NOT_FOUND).json({ message: 'Classroom not found' });
    }

    res.status(HTTP_STATUS_OK).json(classroom);
  } catch (error) {
    console.error('Error fetching classroom:', error);
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
  }
});

virtualClassroomRouter.get('/eligible-students/:id', async (req: Request, res: Response) => {
  try {
    await virtualClassroomController.getEligibleStudents(req, res);
  } catch (error) {
    logger.error('Error in route handler for eligible students:', error);
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
  }
});

virtualClassroomRouter.get('/enrolled-students/:id', async (req: Request, res: Response) => {
  try {
    await virtualClassroomController.getEnrolledStudents(req, res);
  } catch (error) {
    logger.error('Error in route handler for eligible students:', error);
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
  }
});

virtualClassroomRouter.post('/', async (req, res) => {
  try {
    await virtualClassroomController.createClassroom(req, res);
  } catch (error) {
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ error: 'An error occurred while creating the classroom.' });
  }
});

virtualClassroomRouter.post('/join', async (req, res) => {
  try {
    await virtualClassroomController.joinClassroom(req, res);
  } catch (error) {
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ error: 'An error occurred while joining the classroom.' });
  }
});

// Bulk join students to a classroom
virtualClassroomRouter.post('/bulk-join', async (req, res) => {
  try {
    await virtualClassroomController.bulkJoinClassroom(req, res);
  } catch (error) {
    res
      .status(HTTP_STATUS_INTERNAL_SERVER_ERROR)
      .send({ error: 'An error occurred while bulk joining students to the classroom.' });
  }
});

virtualClassroomRouter.post('/leave', async (req, res) => {
  try {
    await virtualClassroomController.leaveClassroom(req, res);
  } catch (error) {
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ error: 'An error occurred while leaving the classroom.' });
  }
});

// Bulk remove students from a classroom
virtualClassroomRouter.post('/bulk-leave', async (req, res) => {
  try {
    await virtualClassroomController.bulkLeaveClassroom(req, res);
  } catch (error) {
    res
      .status(HTTP_STATUS_INTERNAL_SERVER_ERROR)
      .send({ error: 'An error occurred while bulk removing students from the classroom.' });
  }
});

virtualClassroomRouter.delete('/:id', async (req, res) => {
  try {
    await virtualClassroomController.deleteClassroom(req, res);
  } catch (error) {
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ error: 'An error occurred while deleting the classroom.' });
  }
});

virtualClassroomRouter.get('/:classroomId/units', unitController.getAll);
