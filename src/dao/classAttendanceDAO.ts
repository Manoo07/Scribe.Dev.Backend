// DAO for class attendance
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const createAttendance = async (data: any) => {
  // Insert attendance record
  return await prisma.classAttendance.create({ data });
};

const bulkCreateAttendance = async (data: any[]) => {
  // Insert multiple attendance records
  return await prisma.classAttendance.createMany({ data });
};

const getAttendance = async (id: string) => {
  return await prisma.classAttendance.findUnique({ where: { id } });
};

const updateAttendance = async (id: string, data: any) => {
  return await prisma.classAttendance.update({ where: { id }, data });
};

const deleteAttendance = async (id: string) => {
  return await prisma.classAttendance.delete({ where: { id } });
};

export default {
  createAttendance,
  bulkCreateAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance,
};
