/*
  Warnings:

  - You are about to drop the column `departmentId` on the `Faculty` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Faculty" DROP CONSTRAINT "Faculty_departmentId_fkey";

-- DropIndex
DROP INDEX "Faculty_departmentId_idx";

-- AlterTable
ALTER TABLE "Faculty" DROP COLUMN "departmentId";
