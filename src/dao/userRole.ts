import prisma from '../prisma/prismaClient';

export const userRoleDAO = {
  async getUserRole(userId: string) {
    const userRole = await prisma.userRole.findFirst({
      where: { userId },
      select: { role: true },
    });
    return userRole;
  },
};
