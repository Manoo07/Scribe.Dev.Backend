-- AlterTable
ALTER TABLE "Thread" ADD COLUMN     "classroomId" UUID;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "VirtualClassroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
