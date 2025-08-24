/*
  Warnings:

  - You are about to drop the column `threadCommentId` on the `ThreadLike` table. All the data in the column will be lost.
  - You are about to drop the `ThreadComment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[threadId,userId]` on the table `ThreadLike` will be added. If there are existing duplicate values, this will fail.
  - Made the column `threadStatus` on table `Thread` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `threadId` to the `ThreadLike` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ThreadComment" DROP CONSTRAINT "ThreadComment_threadId_fkey";

-- DropForeignKey
ALTER TABLE "ThreadComment" DROP CONSTRAINT "ThreadComment_userId_fkey";

-- DropForeignKey
ALTER TABLE "ThreadLike" DROP CONSTRAINT "ThreadLike_threadCommentId_fkey";

-- DropIndex
DROP INDEX "ThreadLike_threadCommentId_userId_key";

-- AlterTable
ALTER TABLE "Thread" ADD COLUMN     "acceptedAnswerId" UUID,
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "threadStatus" SET NOT NULL;

-- AlterTable
ALTER TABLE "ThreadLike" DROP COLUMN "threadCommentId",
ADD COLUMN     "threadId" UUID NOT NULL;

-- DropTable
DROP TABLE "ThreadComment";

-- DropEnum
DROP TYPE "CommentState";

-- CreateIndex
CREATE UNIQUE INDEX "ThreadLike_threadId_userId_key" ON "ThreadLike"("threadId", "userId");

-- AddForeignKey
ALTER TABLE "ThreadLike" ADD CONSTRAINT "ThreadLike_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
