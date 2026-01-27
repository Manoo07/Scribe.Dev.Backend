/*
  Warnings:

  - Added the required column `facultyId` to the `Assignment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('OPEN', 'PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'OVERDUE', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "facultyId" UUID NOT NULL,
ADD COLUMN     "questionFileUrl" TEXT,
ADD COLUMN     "status" "AssignmentStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "AssignmentSubmission" ADD COLUMN     "SubmissionFileUrl" TEXT,
ADD COLUMN     "facultyComment" TEXT,
ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
