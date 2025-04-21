import { Request, Response } from 'express';
import { HTTP_STATUS_OK, HTTP_STATUS_INTERNAL_SERVER_ERROR } from '@constants/constants';
import { logger } from '@services/logService';
import UserService from '@services/userService';

class UserController {
  private userService = new UserService();

  getUserById = async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info(`[UserController] Fetching user by ID: ${id}`);
    try {
      const user = await this.userService.getUserById(id);
      logger.info(`[UserController] Successfully fetched user by ID: ${id}`);
      return res.status(HTTP_STATUS_OK).json(user);
    } catch (err: any) {
      logger.error(`[UserController] Error fetching user by ID: ${err.message}`);
      return res.status(err.status || HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };
  getAllUsers = async (req: Request, res: Response) => {
    logger.info('[UserController] Fetching all users');
    try {
      const users = await this.userService.getAllUsers();
      logger.info(`[UserController] Successfully fetched ${users.length} users`);
      return res.status(HTTP_STATUS_OK).json(users);
    } catch (err: any) {
      logger.error(`[UserController] Error fetching users: ${err.message}`);
      return res.status(err.status || HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    logger.info(`[UserController] Updating user with ID: ${id}`);
    try {
      const user = await this.userService.updateUser(id, updateData);
      logger.info(`[UserController] Successfully updated user with ID: ${id}`);
      return res.status(HTTP_STATUS_OK).json(user);
    } catch (err: any) {
      logger.error(`[UserController] Error updating user: ${err.message}`);
      return res.status(err.status || HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info(`[UserController] Deleting user with ID: ${id}`);
    try {
      const user = await this.userService.deleteUser(id);
      logger.info(`[UserController] Successfully deleted user with ID: ${id}`);
      return res.status(HTTP_STATUS_OK).json({
        message: 'User deleted successfully',
        user,
      });
    } catch (err: any) {
      logger.error(`[UserController] Error deleting user: ${err.message}`);
      return res.status(err.status || HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };
}

export default UserController;
