/*
  Warnings:

  - You are about to drop the column `classroomId` on the `Thread` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Thread" DROP CONSTRAINT "Thread_classroomId_fkey";

-- DropIndex
DROP INDEX "Thread_classroomId_idx";

-- AlterTable
ALTER TABLE "Thread" DROP COLUMN "classroomId";
