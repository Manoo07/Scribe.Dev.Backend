/*
  Warnings:

  - You are about to drop the column `SubmissionFileUrl` on the `AssignmentSubmission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AssignmentSubmission" DROP COLUMN "SubmissionFileUrl",
ADD COLUMN     "submissionFileUrl" TEXT;
