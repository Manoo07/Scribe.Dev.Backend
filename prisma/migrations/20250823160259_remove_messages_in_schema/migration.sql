/*
  Warnings:

  - You are about to drop the column `title` on the `ThreadComment` table. All the data in the column will be lost.
  - You are about to drop the `Messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Messages" DROP CONSTRAINT "Messages_threadId_fkey";

-- DropForeignKey
ALTER TABLE "Messages" DROP CONSTRAINT "Messages_userId_fkey";

-- AlterTable
ALTER TABLE "ThreadComment" DROP COLUMN "title";

-- DropTable
DROP TABLE "Messages";
