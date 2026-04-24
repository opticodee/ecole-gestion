-- CreateEnum
CREATE TYPE "AcademicYearStatus" AS ENUM ('BROUILLON', 'ACTIVE', 'CLOTUREE');

-- AlterTable
ALTER TABLE "AcademicYear" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "status" "AcademicYearStatus" NOT NULL DEFAULT 'BROUILLON',
ADD COLUMN     "trimestre1End" TIMESTAMP(3),
ADD COLUMN     "trimestre1Start" TIMESTAMP(3),
ADD COLUMN     "trimestre2End" TIMESTAMP(3),
ADD COLUMN     "trimestre2Start" TIMESTAMP(3),
ADD COLUMN     "trimestre3End" TIMESTAMP(3),
ADD COLUMN     "trimestre3Start" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
