import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const UserDAO = {
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
};

export default UserDAO;