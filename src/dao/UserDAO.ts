import { logger } from '../services/logService';
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

const UserDAO = {
  findAll: async () => {
    return prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
      },
    });
  },

  findById: async (id: string) => {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  findByUsername: (username: string) => {
    return prisma.user.findUnique({
      where: { username },
    });
  },

  updateById: (id: string, data: Partial<User>) => {
    return prisma.user.update({ where: { id }, data });
  },

  deleteById: (id: string) => {
    return prisma.user.delete({ where: { id } });
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
