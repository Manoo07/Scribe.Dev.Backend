import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const userRoleDAO = {
  async getUserRole(userId: string) {
    const userRole = await prisma.userRole.findFirst({
      where: { userId },
      select: { role: true },
    });
    return userRole;
  },
};
