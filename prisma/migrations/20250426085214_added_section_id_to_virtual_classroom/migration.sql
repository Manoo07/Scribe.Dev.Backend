/*
  Warnings:

  - Added the required column `sectionId` to the `VirtualClassroom` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VirtualClassroom" ADD COLUMN     "sectionId" UUID NOT NULL,
ALTER COLUMN "syllabusUrl" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "VirtualClassroom" ADD CONSTRAINT "VirtualClassroom_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
