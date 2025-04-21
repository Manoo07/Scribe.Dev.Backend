import { PrismaClient, User } from '@prisma/client';
import UserDAO from '@dao/userDAO';
import { logger } from '@services/logService';
import {
  ALPHABETIC_ONLY_REGEX,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} from '@constants/constants';

class UserService {
  private prisma = new PrismaClient();

  async getUserById(id: string) {
    const user = await UserDAO.findById(id);
    if (!user) {
      logger.warn(`[UserService] User not found with ID: ${id}`);
      throw { status: HTTP_STATUS_NOT_FOUND, message: 'User not found' };
    }
    return user;
  }

  async getAllUsers() {
    try {
      const users = await UserDAO.findAll();
      logger.info(`[UserService] Fetched ${users.length} users`);
      return users;
    } catch (error) {
      logger.error(`[UserService] Error fetching users: ${error}`);
      throw {
        status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch users',
      };
    }
  }

  async updateUser(id: string, data: Partial<User>) {
    try {
      if (data.username && !ALPHABETIC_ONLY_REGEX.test(data.username)) {
        logger.warn(`[UserService] Invalid username format: ${data.username}`);
        throw { status: HTTP_STATUS_BAD_REQUEST, message: 'Username must contain only alphabets' };
      }

      if (data.username) {
        const existingUser = await UserDAO.findByUsernameExcludingId(data.username, id);
        if (existingUser) {
          logger.warn(`[UserService] Username already taken: ${data.username}`);
          throw { status: HTTP_STATUS_BAD_REQUEST, message: 'Username already taken' };
        }
      }

      const user = await UserDAO.updateById(id, data);
      logger.info(`[UserService] Updated user with ID: ${id}`);
      return user;
    } catch (error: any) {
      logger.error(`[UserService] Error updating user ${id}: ${error.message || error}`);
      throw error.status ? error : { status: HTTP_STATUS_INTERNAL_SERVER_ERROR, message: 'Failed to update user' };
    }
  }
  async deleteUser(id: string) {
    try {
      const user = await UserDAO.deleteById(id);
      logger.info(`[UserService] Deleted user with ID: ${id}`);
      return user;
    } catch (error) {
      logger.error(`[UserService] Error deleting user ${id}: ${error}`);
      throw { status: HTTP_STATUS_INTERNAL_SERVER_ERROR, message: 'Failed to delete user' };
    }
  }
}

export default UserService;
