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
    enrollmentNo?: string;
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
      enrollmentNo,
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
      logger.info(`User created: ${email}`);

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
        if (!enrollmentNo) {
          throw new Error('Enrollment number is required for students.');
        }

        const existingStudent = await tx.student.findUnique({
          where: { enrollmentNo },
        });

        if (existingStudent) {
          throw new Error('Enrollment number is already in use.');
        }
        await tx.student.create({
          data: {
            userId: user.id,
            enrollmentNo,
          },
        });
        logger.info(`Created student profile for user ${user.id}`);
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
        logger.info(`Created faculty profile for user ${user.id}`);
      }

      return user;
    });
  },

  async update(filter: Prisma.UserWhereUniqueInput, data: Partial<User>): Promise<User> {
    try {
      logger.info(`[UserDAO] Updating user with filter: ${JSON.stringify(filter)}`);
      return await prisma.user.update({
        where: filter,
        data,
      });
    } catch (error) {
      logger.error(`[UserDAO] Error updating user with filter: ${JSON.stringify(filter)}`, error);
      throw new Error('[UserDAO] Failed to update user');
    }
  },

  async delete(userId: string): Promise<User> {
    try {
      logger.info(`[UserDAO] Deleting user with ID: ${userId}`);
      return await prisma.user.delete({ where: { id: userId } });
    } catch (error) {
      logger.error(`[UserDAO] Error deleting user by ID: ${userId}`, error);
      throw new Error('[UserDAO] Failed to delete user');
    }
  },
};

export default UserDAO;
