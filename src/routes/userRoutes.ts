import { Router } from 'express';
import UserController from '@controllers/userController';
import { HTTP_STATUS_INTERNAL_SERVER_ERROR } from '@constants/constants';

const router = Router();
const userController = new UserController();
router.get('/:id', async (req, res) => {
  try {
    await userController.getUserById(req, res);
  } catch (error) {
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ error: 'An error occurred while fetching the user.' });
  }
});

router.get('/', async (req, res) => {
  try {
    await userController.getAllUsers(req, res);
  } catch (error) {
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({
      error: 'An error occurred while fetching users.',
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await userController.updateUser(req, res);
  } catch (error) {
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ error: 'An error occurred while updating the user.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await userController.deleteUser(req, res);
  } catch (error) {
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ error: 'An error occurred while deleting the user.' });
  }
});

export default router;
