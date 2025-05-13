import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from '@services/logService';
import { GetStudentsByFilterParams } from 'types/express';

const prisma = new PrismaClient();

const studentDAO = {
  getAllStudents: async () => {
    logger.info('[studentDAO] getAllStudents: Start');
    try {
      const students = await prisma.student.findMany();
      logger.info('[studentDAO] getAllStudents: Success');
      return students;
    } catch (error) {
      logger.error('[studentDAO] getAllStudents: Error', error);
      throw error;
    }
  },

  getStudentByUserId: async (userId: string) => {
    logger.info(`[studentDAO] getStudentByUserId: Start for userId = ${userId}`);
    try {
      const student = await prisma.student.findUnique({
        where: { userId },
      });
      logger.info('[studentDAO] getStudentByUserId: Success');
      return student;
    } catch (error) {
      logger.error('[studentDAO] getStudentByUserId: Error', error);
      throw error;
    }
  },

  getStudentsByFilter: async ({ filter = {}, select, include }: GetStudentsByFilterParams) => {
    logger.info('[studentDAO] getStudentsByFilter: Start');
    try {
      const query: Prisma.StudentFindManyArgs = {
        where: filter,
      };

      if (select) {
        query.select = select;
      } else if (include) {
        query.include = include;
      }

      const students = await prisma.student.findMany(query);
      logger.info('[studentDAO] getStudentsByFilter: Success');
      return students;
    } catch (error) {
      logger.error('[studentDAO] getStudentsByFilter: Error', error);
      throw error;
    }
  },

  getStudentById: async (studentId: string) => {
    logger.info(`[studentDAO] getStudentById: Start for studentId = ${studentId}`);
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
        },
      });
      logger.info('[studentDAO] getStudentById: Success');
      return student;
    } catch (error) {
      logger.error('[studentDAO] getStudentById: Error', error);
      throw error;
    }
  },

  createStudent: async (studentData: Prisma.StudentCreateInput) => {
    logger.info('[studentDAO] createStudent: Start');
    try {
      const student = await prisma.student.create({
        data: studentData,
      });
      logger.info('[studentDAO] createStudent: Success');
      return student;
    } catch (error) {
      logger.error('[studentDAO] createStudent: Error', error);
      throw error;
    }
  },

  updateStudent: async (studentId: string, data: Prisma.StudentUpdateInput) => {
    logger.info(`[studentDAO] updateStudent: Start for studentId = ${studentId}`);
    try {
      const student = await prisma.student.update({
        where: { id: studentId },
        data,
      });
      logger.info('[studentDAO] updateStudent: Success');
      return student;
    } catch (error) {
      logger.error('[studentDAO] updateStudent: Error', error);
      throw error;
    }
  },

  deleteStudent: async (studentId: string) => {
    logger.info(`[studentDAO] deleteStudent: Start for studentId = ${studentId}`);
    try {
      const student = await prisma.student.delete({
        where: { id: studentId },
      });
      logger.info('[studentDAO] deleteStudent: Success');
      return student;
    } catch (error) {
      logger.error('[studentDAO] deleteStudent: Error', error);
      throw error;
    }
  },
};

export default studentDAO;
