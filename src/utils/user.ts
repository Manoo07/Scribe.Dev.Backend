import { Prisma, Role } from '@prisma/client';
import { logger } from '@services/logService';

export async function getOrFallbackSectionId(tx: Prisma.TransactionClient, inputSectionId?: string): Promise<string> {
  if (inputSectionId) return inputSectionId;

  const defaultSection = await tx.section.findFirst({ where: { name: 'ALPHA' } });
  if (!defaultSection) {
    throw new Error('Default section "ALPHA" not found in the database.');
  }
  return defaultSection.id;
}

export async function createUserRole(
  tx: Prisma.TransactionClient,
  data: {
    userId: string;
    role: Role;
    collegeId?: string;
    departmentId?: string;
    sectionId?: string;
    yearId?: string;
  },
) {
  const { userId, role, collegeId, departmentId, sectionId, yearId } = data;

  await tx.userRole.create({
    data: {
      userId,
      role,
      collegeId,
      departmentId,
      sectionId,
      yearId,
    },
  });

  logger.info(`[userUtils] Assigned role ${role} to user ${userId}`);
}
