/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `UserRole` will be added. If there are existing duplicate values, this will fail.
  - Made the column `resetToken` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "UserRole_role_idx";

-- DropIndex
DROP INDEX "UserRole_userId_role_departmentId_sectionId_key";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "resetToken" SET NOT NULL;

-- CreateTable
CREATE TABLE "Messages" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "threadId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Messages_threadId_idx" ON "Messages"("threadId");

-- CreateIndex
CREATE INDEX "Messages_userId_idx" ON "Messages"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_key" ON "UserRole"("userId");

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
