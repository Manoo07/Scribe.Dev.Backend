import { PrismaClient, Role } from '@prisma/client';
import { comparePasswords, hashPassword } from '@utils/hashUtil';
import { generateToken } from '@utils/jwtUtil';
import {
  DIGEST_FORMAT,
  HASH_ALGORITHM,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  PRISMA_RECORD_NOT_FOUND,
  PRISMA_UNIQUE_CONSTRAINT_VIOLATION,
  RESET_TOKEN_EXPIRY_TIME,
  Roles,
  USER_NAME_REGEX_PATTERN,
  USER_NOT_FOUND_ERROR,
} from '@constants/constants';
import UserDAO from '@dao/userDAO';
import { generateResetToken } from '@utils/authUtil';
import { sendResetEmail } from '@services/emailService';
import crypto from 'crypto';
import { logger } from '@services/logService';
import { generateUsername } from '@utils/userUtils';

interface SignupParams {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  collegeId: string;
  role: Role;
  departmentId: string;
  sectionId: string;
  specialization?: string;
}

interface ErrorResponse {
  error: string;
  status: number;
}

type SignupResult = any | ErrorResponse;

class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public async signup(params: SignupParams): Promise<SignupResult> {
    const { firstName, lastName, username, email, password, collegeId, role, departmentId, sectionId, specialization } =
      params;

    const missingFields = this.checkMissingFields(params);
    if (missingFields) {
      logger.warn(`Missing required fields: ${missingFields.join(', ')}`);

      return {
        error: 'Missing required fields.',
        message: `Missing fields: ${missingFields.join(', ')}`,
        status: HTTP_STATUS_BAD_REQUEST,
      };
    }

    try {
      const validationError = this.validateSignupParams(params);
      if (validationError) {
        logger.warn(validationError.error);
        return validationError;
      }

      logger.info(`Signing up user: ${email}`);
      const finalUsername = generateUsername(username, firstName, lastName);
      const usernameRegex = new RegExp(USER_NAME_REGEX_PATTERN);
      if (!usernameRegex.test(finalUsername)) {
        return {
          error: 'Username must contain only alphabetic characters (a-z, A-Z)',
          status: HTTP_STATUS_BAD_REQUEST,
        };
      }
      const existingUserWithUsername = await this.prisma.user.findUnique({
        where: { username: finalUsername },
      });

      if (existingUserWithUsername) {
        return { error: 'Username already taken.', status: HTTP_STATUS_BAD_REQUEST };
      }

      const hashedPassword = await hashPassword(password);

      // Prisma Transaction
      const result = await this.prisma.$transaction(async () => {
        const user = await this.createUser(
          this.prisma,
          firstName,
          lastName,
          username,
          email,
          hashedPassword,
          collegeId
        );

        await this.createUserRole(this.prisma, user.id, role, collegeId, departmentId, sectionId);

        if (role === Roles.STUDENT) {
          await this.createStudent(this.prisma, user.id);
        } else if (role === Roles.FACULTY) {
          await this.createFaculty(this.prisma, user.id, departmentId, specialization);
        }

        return user;
      });

      logger.info(`User ${email} successfully signed up.`);
      return result;
    } catch (err: any) {
      logger.error(`Error during signup for user ${email}: ${err.message}`);
      logger.error('Error during signup:', err);
      return this.handleSignupError(err);
    }
  }

  public async signin(email: string, password: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await comparePasswords(password, user.password))) {
      logger.info(`User ${email} successfully signed in.`);
      return generateToken(user.id);
    }

    logger.warn(`Signin failed for user ${email}. Incorrect credentials.`);
    return null;
  }

  public async forgotPassword(email: string): Promise<void> {
    const user = await UserDAO.findByEmail(email);

    if (!user) {
      logger.error(`User ${email} not found during password reset.`);
      throw new Error(USER_NOT_FOUND_ERROR);
    }

    const { token, hashed } = generateResetToken();
    await UserDAO.updateResetToken(email, hashed, RESET_TOKEN_EXPIRY_TIME);
    await sendResetEmail(email, token);
    logger.info(`Password reset token sent to user ${email}.`);
  }

  public async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashed = crypto.createHash(HASH_ALGORITHM).update(token).digest(DIGEST_FORMAT);
    const user = await UserDAO.findByResetToken(hashed);

    if (!user) {
      logger.error(`Invalid or expired token during password reset.`);
      throw new Error('Invalid or expired token');
    }

    const hashedPassword = await hashPassword(newPassword);
    await UserDAO.updatePasswordAndClearToken(user.id, hashedPassword);
    logger.info(`User ${user.email} successfully reset their password.`);
  }

  private checkMissingFields(params: SignupParams): string[] | null {
    const { firstName, lastName, username, email, password, collegeId, role, departmentId, sectionId } = params;
    const missing: string[] = [];
    if (!firstName) missing.push('firstName');
    if (!lastName) missing.push('lastName');
    if (!username) missing.push('username');
    if (!email) missing.push('email');
    if (!password) missing.push('password');
    if (!collegeId) missing.push('collegeId');
    if (!role) missing.push('role');
    if (!departmentId) missing.push('departmentId');
    if (!sectionId) missing.push('sectionId');

    return missing.length > 0 ? missing : null;
  }

  // -------------------- Helper Functions --------------------

  private validateSignupParams(params: SignupParams): ErrorResponse | null {
    const { role, departmentId, sectionId } = params;

    if (!Object.values(Role).includes(role)) {
      logger.warn(`Invalid role provided: ${role}`);
      return { error: 'Invalid role provided.', status: HTTP_STATUS_BAD_REQUEST };
    }

    if ((role === 'STUDENT' || role === 'FACULTY') && !departmentId) {
      logger.warn(`Department ID is required for Student and Faculty roles.`);
      return { error: 'Department ID is required for Student and Faculty roles.', status: HTTP_STATUS_BAD_REQUEST };
    }

    if (role === 'STUDENT' && !sectionId) {
      logger.warn(`Section ID is required for Student roles.`);
      return { error: 'Section ID is required for Student roles.', status: HTTP_STATUS_BAD_REQUEST };
    }

    return null;
  }

  private async createUser(
    prisma: PrismaClient,
    firstName: string,
    lastName: string,
    username: string,
    email: string,
    passwordHash: string,
    collegeId?: string
  ) {
    try {
      // Check if college is present or not
      await prisma.college.findFirstOrThrow({
        where: {
          id: collegeId,
        },
      });

      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          username,
          email,
          password: passwordHash,
          collegeId,
        },
      });
      logger.debug(`User created: ${email}`);
      return user;
    } catch (error: any) {
      logger.error(`Error creating user ${email}: ${error.message}`);
      throw new Error('College Not found');
    }
  }

  private async createUserRole(
    prisma: PrismaClient,
    userId: string,
    role: Role,
    collegeId?: string,
    departmentId?: string,
    sectionId?: string
  ) {
    await prisma.userRole.create({
      data: {
        userId,
        role,
        collegeId,
        departmentId,
        sectionId,
      },
    });
    logger.debug(`Assigned role ${role} to user ${userId}`);
  }

  private async createStudent(prisma: PrismaClient, userId: string) {
    await prisma.student.create({
      data: {
        userId,
        enrollmentNo: 'TEMP' + userId, // TODO: Implement a better enrollment number generation
      },
    });
    logger.debug(`Created student profile for user ${userId}`);
  }

  private async createFaculty(prisma: PrismaClient, userId: string, departmentId: string, specialization?: string) {
    const facultyData: any = {
      userId,
      department: { connect: { id: departmentId } },
      user: { connect: { id: userId } },
    };
    if (specialization) {
      facultyData.specialization = specialization;
    }

    await prisma.faculty.create({
      data: facultyData,
    });
    logger.debug(`Created faculty profile for user ${userId}`);
  }

  private handleSignupError(error: any): ErrorResponse {
    if (error.code === PRISMA_UNIQUE_CONSTRAINT_VIOLATION) {
      logger.warn('Email address is already in use.');
      return { error: 'Email address is already in use.', status: HTTP_STATUS_CONFLICT };
    } else if (error.code === PRISMA_RECORD_NOT_FOUND || error.message === 'College Not found') {
      logger.warn('Invalid College, Department, or Section ID.');

      return { error: 'Invalid College, Department, or Section ID.', status: HTTP_STATUS_BAD_REQUEST };
    } else if (error.message === 'Specialization is required for faculty.') {
      logger.warn('Specialization is required for faculty.');
      return { error: error.message, status: HTTP_STATUS_BAD_REQUEST };
    } else {
      logger.error(`Failed to create user: ${error.message}`);
      return { error: 'Failed to create user.', status: HTTP_STATUS_INTERNAL_SERVER_ERROR };
    }
  }
}
export default AuthService;
