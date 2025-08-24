/*
  Warnings:

  - You are about to drop the column `threadId` on the `ThreadLike` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[threadCommentId,userId]` on the table `ThreadLike` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `threadCommentId` to the `ThreadLike` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ThreadLike" DROP CONSTRAINT "ThreadLike_threadId_fkey";

-- DropIndex
DROP INDEX "ThreadLike_threadId_userId_key";

-- AlterTable
ALTER TABLE "ThreadLike" DROP COLUMN "threadId",
ADD COLUMN     "threadCommentId" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ThreadLike_threadCommentId_userId_key" ON "ThreadLike"("threadCommentId", "userId");

-- AddForeignKey
ALTER TABLE "ThreadLike" ADD CONSTRAINT "ThreadLike_threadCommentId_fkey" FOREIGN KEY ("threadCommentId") REFERENCES "ThreadComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
