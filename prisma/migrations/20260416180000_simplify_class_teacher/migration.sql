-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_teacherId_fkey";

-- AlterTable
ALTER TABLE "Schedule" DROP COLUMN "subjectId",
DROP COLUMN "teacherId";
