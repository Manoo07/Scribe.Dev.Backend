import { Request, Response, Router } from 'express';
import { VirtualClassroomController } from '@controllers/virtualClassroomController';
import { HTTP_STATUS_INTERNAL_SERVER_ERROR } from '@constants/constants';

export const virtualClassroomRouter = Router();
const virtualClassroomController = new VirtualClassroomController();

virtualClassroomRouter.get('/', async (req: Request, res: Response) => {
  try {
    await virtualClassroomController.getClassrooms(req, res);
  } catch (error) {
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ error: 'An error occurred while fetching the classrooms.' });
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
