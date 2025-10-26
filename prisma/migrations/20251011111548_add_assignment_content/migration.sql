/*
  Warnings:

  - Changed the type of `content` on the `Assignment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AssignmentContent" AS ENUM ('NOTE', 'QUESTION_FILE');

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "description" TEXT,
ADD COLUMN     "noteContent" TEXT,
DROP COLUMN "content",
ADD COLUMN     "content" "AssignmentContent" NOT NULL;
