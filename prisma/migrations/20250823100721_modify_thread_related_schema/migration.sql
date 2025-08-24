/*
  Warnings:

  - Added the required column `userId` to the `Thread` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ThreadStatus" AS ENUM ('RESOLVED', 'UNANSWERED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CommentState" AS ENUM ('ACCEPTED', 'NONE');

-- AlterTable
ALTER TABLE "Thread" ADD COLUMN     "threadStatus" "ThreadStatus" DEFAULT 'UNANSWERED',
ADD COLUMN     "userId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "ThreadComment" ADD COLUMN     "commentState" "CommentState" DEFAULT 'NONE',
ADD COLUMN     "title" TEXT;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
