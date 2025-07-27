-- AlterTable
ALTER TABLE "UserRole" ADD COLUMN     "yearId" UUID;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "Year"("id") ON DELETE CASCADE ON UPDATE CASCADE;
