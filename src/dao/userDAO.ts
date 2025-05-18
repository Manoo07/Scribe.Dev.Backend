import { PrismaClient, Prisma, User, Role } from '@prisma/client';
import { logger } from '@services/logService';
import cleanObject from '@utils/cleanObject';
import { createUserRole, getOrFallbackSectionId } from '@utils/user';

const prisma = new PrismaClient();

const UserDAO = {
  async getAll({
    filter,
    select,
    include,
  }: {
    filter?: Prisma.UserWhereInput;
    select?: Prisma.UserSelect;
    include?: Prisma.UserInclude;
  }): Promise<User[]> {
    try {
      logger.info('[UserDAO] Fetching all users');
      const query = cleanObject({ where: filter, select, include });
      return await prisma.user.findMany(query);
    } catch (error) {
      logger.error('[UserDAO] Error fetching all users:', error);
      throw new Error('[UserDAO] Failed to fetch users');
    }
  },

  async get({
    filter,
    select,
    include,
  }: {
    filter?: Prisma.UserWhereInput;
    select?: Prisma.UserSelect;
    include?: Prisma.UserInclude;
  }): Promise<(User & { userRole?: { role: string } }) | null> {
    try {
      logger.info('[UserDAO] Fetching one user');
      const query = cleanObject({ where: filter, select, include });
      return await prisma.user.findFirst(query);
    } catch (error) {
      logger.error('[UserDAO] Error fetching user:', error);
      throw new Error('[UserDAO] Failed to fetch user');
    }
  },

  async create(params: {
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
    logger.info(`Signup params is : ${JSON.stringify(params)}`);
    return await prisma.$transaction(async (tx) => {
      // Validate college existence if ID provided
      if (collegeId) {
        await tx.college.findFirstOrThrow({ where: { id: collegeId } });
      }

      // Create base user
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          username,
          email,
          password,
          college: {
            connect: { id: collegeId },
          },
        },
      });
      logger.debug(`User created: ${email}`);

      // Ensure section ID
      const sectionId = await getOrFallbackSectionId(tx, inputSectionId);

      // Create user role
      await createUserRole(tx, {
        userId: user.id,
        role,
        collegeId,
        departmentId,
        sectionId,
      });

      if (role === Role.STUDENT) {
        await tx.student.create({
          data: {
            userId: user.id,
            enrollmentNo: 'TEMP' + user.id,
          },
        });
        logger.debug(`Created student profile for user ${user.id}`);
      } else if (role === Role.FACULTY) {
        if (!departmentId) {
          throw new Error('Department ID is required for faculty.');
        }

        await tx.faculty.create({
          data: {
            specialization: specialization ?? undefined,
            user: { connect: { id: user.id } },
          },
        });
        logger.debug(`Created faculty profile for user ${user.id}`);
      }

      return user;
    });
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    try {
      logger.info(`[UserDAO] Updating user with ID: ${id}`);
      return await prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error(`[UserDAO] Error updating user by ID: ${id}`, error);
      throw new Error('[UserDAO] Failed to update user');
    }
  },

  async delete(id: string): Promise<User> {
    try {
      logger.info(`[UserDAO] Deleting user with ID: ${id}`);
      return await prisma.user.delete({ where: { id } });
    } catch (error) {
      logger.error(`[UserDAO] Error deleting user by ID: ${id}`, error);
      throw new Error('[UserDAO] Failed to delete user');
    }
  },
};

export default UserDAO;
