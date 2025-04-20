import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { logger } from '../services/logService';
import { PrismaClient, User } from '@prisma/client';
import { PRISMA_RECORD_NOT_FOUND } from '../constants/constants';

const prisma = new PrismaClient();

const UserDAO = {
  

  findAll: async () => {
    try {
      logger.info('Fetching all users');
      return await prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
        },
      });
    } catch (error) {
      logger.error('Error fetching all users:', error);
      throw new Error('Failed to fetch users');
    }
  },
  findByUsernameExcludingId: async (username: string, excludeId: string) => {
    try {
      logger.info(`Checking if username "${username}" is taken by another user (excluding ID: ${excludeId})`);
      const user = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: excludeId },
        },
      });
  
      if (user) {
        logger.info(`Username "${username}" is already taken by another user.`);
      } else {
        logger.info(`Username "${username}" is available.`);
      }
  
      return user;
    } catch (error) {
      logger.error(`Error checking username uniqueness for "${username}":`, error);
      throw new Error('Failed to check username uniqueness');
    }
  },
  

  findById: async (id: string) => {
    try {
      logger.info(`Fetching user by ID: ${id}`);
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        logger.warn(`User not found with ID: ${id}`);
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      logger.error(`Error fetching user by ID: ${id}`, error);
      throw error;
    }
  },

  findByUsername: async (username: string) => {
    try {
      logger.info(`Fetching user by username: ${username}`);
      return await prisma.user.findUnique({ where: { username } });
    } catch (error) {
      logger.error(`Error fetching user by username: ${username}`, error);
      throw error;
    }
  },

  updateById: async (id: string, data: Partial<User>) => {
    try {
      logger.info(`Updating user with ID: ${id}`, data);
      return await prisma.user.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error instanceof PrismaClientKnownRequestError && error.code === PRISMA_RECORD_NOT_FOUND) {
        logger.warn(`User not found for update: ${id}`);
        throw new Error('User not found');
      }
      logger.error(`Error updating user by ID: ${id}`, error);
      throw new Error('Failed to update user');
    }
  },

  deleteById: async (id: string) => {
    try {
      logger.info(`Deleting user with ID: ${id}`);
      return await prisma.user.delete({ where: { id } });
    } catch (error: any) {
      if (error instanceof PrismaClientKnownRequestError && error.code === PRISMA_RECORD_NOT_FOUND) {
        logger.warn(`User not found for deletion: ${id}`);
        throw new Error('User not found');
      }
      logger.error(`Error deleting user with ID: ${id}`, error);
      throw new Error('Failed to delete user');
    }
  },

  findByEmail: async (email: string) => {
    try {
      logger.info(`Finding user by email: ${email}`);
      const user = await prisma.user.findUnique({ where: { email } });
      logger.info(`User ${user ? 'found' : 'not found'} for email: ${email}`);
      return user;
    } catch (error) {
      logger.error(`Error finding user by email ${email}: ${error}`);
      throw error;
    }
  },

  updateLastLogin: async (userId: string) => {
    try {
      logger.info(`Updating last login for user ID: ${userId}`);
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { lastLogin: new Date() },
      });
      logger.info(`Last login updated for user ID: ${userId}`);
      return updatedUser;
    } catch (error) {
      logger.error(`Error updating last login for user ID ${userId}: ${error}`);
      throw error;
    }
  },

  findByResetToken: async (hashedToken: string) => {
    try {
      logger.info(`Finding user by reset token`);
      const user = await prisma.user.findFirst({
        where: {
          resetToken: hashedToken,
          resetTokenExpiry: { gt: new Date() },
        },
      });
      logger.info(`User ${user ? 'found' : 'not found'} with reset token`);
      return user;
    } catch (error) {
      logger.error(`Error finding user by reset token: ${error}`);
      throw error;
    }
  },

  updatePasswordAndClearToken: async (userId: string, hashedPassword: string) => {
    try {
      logger.info(`Updating password and clearing token for user ID: ${userId}`);
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
      logger.info(`Password updated and token cleared for user ID: ${userId}`);
      return updatedUser;
    } catch (error) {
      logger.error(`Error updating password and clearing token for user ID ${userId}: ${error}`);
      throw error;
    }
  },

  updateResetToken: async (email: string, hashedToken: string, expiryTime: number) => {
    try {
      logger.info(`Updating reset token for email: ${email}`);
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          resetToken: hashedToken,
          resetTokenExpiry: new Date(Date.now() + expiryTime),
        },
      });
      logger.info(`Reset token updated for email: ${email}`);
      return updatedUser;
    } catch (error) {
      logger.error(`Error updating reset token for email ${email}: ${error}`);
      throw error;
    }
  },
};

export default UserDAO;
