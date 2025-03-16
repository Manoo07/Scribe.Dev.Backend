/*
  Warnings:

  - You are about to drop the column `sectionId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the `Messages` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `ThreadComment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- DropForeignKey
ALTER TABLE "Messages" DROP CONSTRAINT "Messages_threadId_fkey";

-- DropForeignKey
ALTER TABLE "Messages" DROP CONSTRAINT "Messages_userId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_sectionId_fkey";

-- DropIndex
DROP INDEX "Student_sectionId_idx";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "sectionId";

-- AlterTable
ALTER TABLE "ThreadComment" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Messages";
