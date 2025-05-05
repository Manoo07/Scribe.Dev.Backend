import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { logger } from '@services/logService';
import { PrismaClient, Role, User } from '@prisma/client';
import { PRISMA_RECORD_NOT_FOUND } from '@constants/constants';
import { error } from 'console';

const prisma = new PrismaClient();

const UserDAO = {
  findAll: async () => {
    try {
      logger.info('[UserDAO] Fetching all users');
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
      logger.error('[UserDAO] Error fetching all users:', error);
      throw new Error('[UserDAO] Failed to fetch users');
    }
  },
  findByUsernameExcludingId: async (username: string, excludeId: string) => {
    try {
      logger.info(`[UserDAO] Checking if username "${username}" is taken by another user (excluding ID: ${excludeId})`);
      const user = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: excludeId },
        },
      });

      if (user) {
        logger.info(`[UserDAO] Username "${username}" is already taken by another user.`);
      } else {
        logger.info(`[UserDAO] Username "${username}" is available.`);
      }

      return user;
    } catch (error) {
      logger.error(`[UserDAO] Error checking username uniqueness for "${username}":`, error);
      throw new Error('[UserDAO] Failed to check username uniqueness');
    }
  },

  findByUsername: async (username: string): Promise<User | null> => {
    try {
      logger.info(`Checking if username exists: ${username}`);
      return await prisma.user.findUnique({ where: { username } });
    } catch (error) {
      logger.error(`Error checking username existence: ${error}`);
      throw error;
    }
  },

  async createUser(params: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    collegeId?: string;
    role: Role;
    departmentId?: string;
    sectionId?: string;
    specialization?: string;
  }) {
    const {
      firstName,
      lastName,
      username,
      email,
      password,
      collegeId,
      role,
      departmentId,
      sectionId: inputSectionId,
      specialization,
    } = params;

    return await prisma.$transaction(async (tx) => {
      // Validate college
      if (collegeId) {
        await tx.college.findFirstOrThrow({
          where: { id: collegeId },
        });
      }

      // Create user
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          username,
          email,
          password,
          collegeId,
        },
      });

      logger.debug(`User created: ${email}`);

      // Handle section fallback to "ALPHA" if not provided
      let sectionId = inputSectionId;
      if (!sectionId) {
        const defaultSection = await tx.section.findFirst({
          where: { name: 'ALPHA' },
        });

        if (!defaultSection) {
          throw new Error('Default section "ALPHA" not found in the database.');
        }

        sectionId = defaultSection.id;
      }

      // Create user role
      await tx.userRole.create({
        data: {
          userId: user.id,
          role,
          collegeId,
          departmentId,
          sectionId,
        },
      });

      logger.debug(`Assigned role ${role} to user ${user.id}`);

      // Role-specific profile
      if (role === Role.STUDENT) {
        await tx.student.create({
          data: {
            userId: user.id,
            enrollmentNo: 'TEMP' + user.id,
          },
        });
        logger.debug(`Created student profile for user ${user.id}`);
      }

      if (role === Role.FACULTY) {
        if (!departmentId) {
          throw new Error('Department ID is required for faculty.');
        }

        const facultyData: any = {
          userId: user.id,
          department: { connect: { id: departmentId } },
          user: { connect: { id: user.id } },
        };

        if (specialization) {
          facultyData.specialization = specialization;
        }

        await tx.faculty.create({ data: facultyData });
        logger.debug(`Created faculty profile for user ${user.id}`);
      }

      return user;
    });
  },

  findById: async (id: string) => {
    try {
      logger.info(`[UserDAO] Fetching user by ID: ${id}`);
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        logger.warn(`[UserDAO] User not found with ID: ${id}`);
        throw new Error('[UserDAO] User not found');
      }
      return user;
    } catch (error) {
      logger.error(`[UserDAO] Error fetching user by ID: ${id}`, error);
      throw error;
    }
  },

  updateById: async (id: string, data: Partial<User>) => {
    try {
      logger.info(`[UserDAO] Updating user with ID: ${id}`, data);
      return await prisma.user.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error instanceof PrismaClientKnownRequestError && error.code === PRISMA_RECORD_NOT_FOUND) {
        logger.warn(`[UserDAO] User not found for update: ${id}`);
        throw new Error('[UserDAO] User not found');
      }
      logger.error(`[UserDAO] Error updating user by ID: ${id}`, error);
      throw new Error('[UserDAO] Failed to update user');
    }
  },

  deleteById: async (id: string) => {
    try {
      logger.info(`[UserDAO] Deleting user with ID: ${id}`);
      return await prisma.user.delete({ where: { id } });
    } catch (error: any) {
      if (error instanceof PrismaClientKnownRequestError && error.code === PRISMA_RECORD_NOT_FOUND) {
        logger.warn(`[UserDAO] User not found for deletion: ${id}`);
        throw new Error('[UserDAO] User not found');
      }
      logger.error(`[UserDAO] Error deleting user with ID: ${id}`, error);
      throw new Error('[UserDAO] Failed to delete user');
    }
  },

  findByEmail: async (email: string) => {
    try {
      logger.info(`[UserDAO] Finding user by email: ${email}`);
      const user = await prisma.user.findUnique({ where: { email } });
      logger.info(`[UserDAO] User ${user ? 'found' : 'not found'} for email: ${email}`);
      return user;
    } catch (error) {
      logger.error(`[UserDAO] Error finding user by email ${email}: ${error}`);
      throw error;
    }
  },

  getUserRole: async (userId: string) => {
    try {
      const userRole = await prisma.userRole.findFirst({
        where: { userId },
        select: { role: true },
      });

      if (!userRole) {
        logger.error(`[AUTH] Role not found │ userId=${userId}`);
        throw error;
      }

      return userRole.role;
    } catch (error) {
      logger.error(`[AUTH] Failed to get user role │ userId=${userId} │ Error=${(error as Error).message}`);
      throw error;
    }

  },

  updateLastLogin: async (userId: string) => {
    try {
      logger.info(`[UserDAO] Updating last login for user ID: ${userId}`);
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { lastLogin: new Date() },
      });
      logger.info(`[UserDAO] Last login updated for user ID: ${userId}`);
      return updatedUser;
    } catch (error) {
      logger.error(`[UserDAO] Error updating last login for user ID ${userId}: ${error}`);
      throw error;
    }
  },

  findByResetToken: async (hashedToken: string) => {
    try {
      logger.info(`[UserDAO] Finding user by reset token`);
      const user = await prisma.user.findFirst({
        where: {
          resetToken: hashedToken,
          resetTokenExpiry: { gt: new Date() },
        },
      });
      logger.info(`[UserDAO] User ${user ? 'found' : 'not found'} with reset token`);
      return user;
    } catch (error) {
      logger.error(`[UserDAO] Error finding user by reset token: ${error}`);
      throw error;
    }
  },

  updatePasswordAndClearToken: async (userId: string, hashedPassword: string) => {
    try {
      logger.info(`[UserDAO] Updating password and clearing token for user ID: ${userId}`);
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
      logger.info(`[UserDAO] Password updated and token cleared for user ID: ${userId}`);
      return updatedUser;
    } catch (error) {
      logger.error(`[UserDAO] Error updating password and clearing token for user ID ${userId}: ${error}`);
      throw error;
    }
  },

  updateResetToken: async (email: string, hashedToken: string, expiryTime: number) => {
    try {
      logger.info(`[UserDAO] Updating reset token for email: ${email}`);
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          resetToken: hashedToken,
          resetTokenExpiry: new Date(Date.now() + expiryTime),
        },
      });
      logger.info(`[UserDAO] Reset token updated for email: ${email}`);
      return updatedUser;
    } catch (error) {
      logger.error(`[UserDAO] Error updating reset token for email ${email}: ${error}`);
      throw error;
    }
  },
};

export default UserDAO;
