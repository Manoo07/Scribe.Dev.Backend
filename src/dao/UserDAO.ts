import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const UserDAO = {
  findByEmail: async (email: string) => {
    return prisma.user.findUnique({
      where: { email },
    });
  },



  updateLastLogin: async (userId: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastLogin: new Date(),
      },
    });
  },
  findByResetToken: async (hashedToken: string) => {
    return prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });
  },

  updatePasswordAndClearToken: async (userId: string, hashedPassword: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  },
  updateResetToken: async (email: string, hashedToken: string, expiryTime: number) => {
    return prisma.user.update({
      where: { email },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + expiryTime),
      },
    });
  },
  
};

export default UserDAO;