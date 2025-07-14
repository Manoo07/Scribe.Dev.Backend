-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeToken" TEXT,
ADD COLUMN     "tokenExpiry" TIMESTAMP(3);
