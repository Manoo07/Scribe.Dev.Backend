/*
  Warnings:

  - A unique constraint covering the columns `[studentId,classroomId,date]` on the table `ClassAttendance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ClassAttendance_studentId_classroomId_date_key" ON "ClassAttendance"("studentId", "classroomId", "date");
