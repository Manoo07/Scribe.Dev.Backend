import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from '@services/logService';

const prisma = new PrismaClient();

const studentDAO = {
  getAllStudents: async () => {
    try {
      const students = await prisma.student.findMany();
      return students;
    } catch (error) {
      logger.error('Error fetching all students:', error);
      throw error;
    }
  },
  getStudentByUserId: async (userId: string) => {
    try {
      const student = await prisma.student.findUnique({
        where: { userId },
      });
      return student;
    } catch (error) {
      logger.error('Error fetching student by user ID:', error);
      throw error;
    }
  },
  getStudentsByFilter: async (filter: Prisma.StudentWhereInput) => {
    try {
      const students = await prisma.student.findMany({
        where: filter,
      });
      return students;
    } catch (error) {
      logger.error('Error fetching students by filter:', error);
      throw error;
    }
  },
  getStudentById: async (id: string) => {
    try {
      const student = await prisma.student.findUnique({
        where: { id },
        select: {
          id: true,
        },
      });
      return student;
    } catch (error) {
      logger.error('Error fetching student by ID:', error);
      throw error;
    }
  },
  createStudent: async (data: Prisma.StudentCreateInput) => {
    try {
      const student = await prisma.student.create({
        data,
      });
      return student;
    } catch (error) {
      logger.error('Error creating student:', error);
      throw error;
    }
  },
  updateStudent: async (id: string, data: Prisma.StudentUpdateInput) => {
    try {
      const student = await prisma.student.update({
        where: { id },
        data,
      });
      return student;
    } catch (error) {
      logger.error('Error updating student:', error);
      throw error;
    }
  },
  deleteStudent: async (id: string) => {
    try {
      const student = await prisma.student.delete({
        where: { id },
      });
      return student;
    } catch (error) {
      logger.error('Error deleting student:', error);
      throw error;
    }
  },
};

export default studentDAO;
