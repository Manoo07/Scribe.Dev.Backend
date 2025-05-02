/*
  Warnings:

  - You are about to drop the column `updateAt` on the `VirtualClassroom` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VirtualClassroom" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
