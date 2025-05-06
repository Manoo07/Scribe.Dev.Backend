import { Request, Response, Router } from 'express';
import { VirtualClassroomController } from '@controllers/virtualClassroomController';
import { HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP_STATUS_NOT_FOUND } from '@constants/constants';
import { VirtualClassroomDAO } from '@dao/virtualClassroomDAO';
import { logger } from '@services/logService';

export const virtualClassroomRouter = Router();
const virtualClassroomController = new VirtualClassroomController();

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

    const classroom = await VirtualClassroomDAO.get({ id: classroomId });
    if (!classroom) {
      res.status(404).json({ message: 'Classroom not found' });
    }

    res.status(200).json(classroom);
  } catch (error) {
    console.error('Error fetching classroom:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

virtualClassroomRouter.get('/eligible-students/:id', async (req: Request, res: Response) => {
  try {
    await virtualClassroomController.getEligibleStudents(req, res);
  } catch (error) {
    logger.error('Error in route handler for eligible students:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

virtualClassroomRouter.get('/enrolled-students/:id', async (req: Request, res: Response) => {
  try {
    await virtualClassroomController.getEnrolledStudents(req, res);
  } catch (error) {
    logger.error('Error in route handler for eligible students:', error);
    res.status(500).json({ message: 'Internal Server Error' });
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

virtualClassroomRouter.post('/leave', async (req, res) => {
  try {
    await virtualClassroomController.leaveClassroom(req, res);
  } catch (error) {
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ error: 'An error occurred while leaving the classroom.' });
  }
});
