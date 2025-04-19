import { PrismaClient, Role } from '@prisma/client';
import { comparePasswords, hashPassword } from '../utils/hashUtil';
import { generateToken } from '../utils/jwtUtil';
import { DIGEST_FORMAT, HASH_ALGORITHM, HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_INTERNAL_SERVER_ERROR, RESET_TOKEN_EXPIRY_TIME } from '../constants/constants';
import UserDAO from '../dao/UserDAO';
import { generateResetToken } from '../utils/authUtil';
import { sendResetEmail } from './emailService';
import crypto from 'crypto';

interface SignupParams {
  name: string;
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
    const { name, email, password, collegeId, role, departmentId, sectionId, specialization } = params;

    const missingFields = this.checkMissingFields(params);
    if (missingFields) {
      return { error: 'Missing required fields.', message: `Missing fields: ${missingFields.join(', ')}`, status: HTTP_STATUS_BAD_REQUEST };
    }

    try {
      const validationError = this.validateSignupParams(params);
      if (validationError) {
        return validationError;
      }

      const hashedPassword = await hashPassword(password);

      // Prisma Transaction
      const result = await this.prisma.$transaction(async () => {
        const user = await this.createUser(this.prisma, name, email, hashedPassword, collegeId);

        await this.createUserRole(this.prisma, user.id, role, collegeId, departmentId, sectionId);

        if (role === 'STUDENT') {
          await this.createStudent(this.prisma, user.id);
        } else if (role === 'FACULTY') {
          await this.createFaculty(this.prisma, user.id, departmentId, specialization);
        }

        return user;
      });

      return result;
    } catch (err: any) {
      console.error('Error during signup:', err);
      return this.handleSignupError(err);
    }
  }

  public async signin(email: string, password: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await comparePasswords(password, user.password))) {
      return generateToken(user.id);
    }
    return null;
  }

  private checkMissingFields(params: SignupParams): string[] | null {
    const { name, email, password, collegeId, role, departmentId, sectionId } = params;
    const missing: string[] = [];

    if (!name) missing.push('name');
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
      return { error: 'Invalid role provided.', status: HTTP_STATUS_BAD_REQUEST };
    }

    if ((role === 'STUDENT' || role === 'FACULTY') && !departmentId) {
      return { error: 'Department ID is required for Student and Faculty roles.', status: HTTP_STATUS_BAD_REQUEST };
    }

    if (role === 'STUDENT' && !sectionId) {
      return { error: 'Section ID is required for Student roles.', status: HTTP_STATUS_BAD_REQUEST };
    }
    return null;
  }

  private async createUser(
    prisma: PrismaClient,
    name: string,
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
          name,
          email,
          password: passwordHash,
          collegeId,
        },
      });
      return user;
    } catch (error: any) {
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
  }

  private async createStudent(prisma: PrismaClient, userId: string) {
    await prisma.student.create({
      data: {
        userId,
        enrollmentNo: 'TEMP' + userId, // TODO: Implement a better enrollment number generation
      },
    });
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
  }

  private handleSignupError(error: any): ErrorResponse {
    if (error.code === 'P2002') {
      return { error: 'Email address is already in use.', status: 409 };
    } else if (error.code === 'P2025' || error.message === 'College Not found') {
      return { error: 'Invalid College, Department, or Section ID.', status:HTTP_STATUS_BAD_REQUEST  };
    } else if (error.message === 'Specialization is required for faculty.') {
      return { error: error.message, status: HTTP_STATUS_BAD_REQUEST };
    } else {
      return { error: 'Failed to create user.', status: HTTP_STATUS_INTERNAL_SERVER_ERROR };
    }
  }


  public async forgotPassword(email: string): Promise<void> {
    const user = await UserDAO.findByEmail(email);
  
    if (!user) {
      throw new Error('User not found. Please sign up.');
    }
  
    const { token, hashed } = generateResetToken();
    await UserDAO.updateResetToken(email, hashed, RESET_TOKEN_EXPIRY_TIME);
    await sendResetEmail(email, token);
  }
  
  public async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashed = crypto.createHash(HASH_ALGORITHM).update(token).digest(DIGEST_FORMAT);
    const user = await UserDAO.findByResetToken(hashed);
  
    if (!user) {
      throw new Error('Invalid or expired token');
    }
  
    const hashedPassword = await hashPassword(newPassword);
    await UserDAO.updatePasswordAndClearToken(user.id, hashedPassword);
  }
    
}

export default AuthService;
