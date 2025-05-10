/*
  Warnings:

  - The `resetTokenExpiry` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `updateAt` on the `VirtualClassroomStudent` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `VirtualClassroomStudent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "resetTokenExpiry",
ADD COLUMN     "resetTokenExpiry" BIGINT;

-- AlterTable
ALTER TABLE "VirtualClassroomStudent" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
