-- DropForeignKey
ALTER TABLE "CourseContent" DROP CONSTRAINT "CourseContent_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "Homework" DROP CONSTRAINT "Homework_subjectId_fkey";

-- AlterTable CourseContent
ALTER TABLE "CourseContent" ALTER COLUMN "subjectId" DROP NOT NULL,
ADD COLUMN "title" TEXT,
ADD COLUMN "objectives" TEXT,
ADD COLUMN "remarks" TEXT;

-- AlterTable Homework
ALTER TABLE "Homework" ALTER COLUMN "subjectId" DROP NOT NULL,
ADD COLUMN "title" TEXT,
ADD COLUMN "instructions" TEXT;

-- CreateIndex
CREATE INDEX "CourseContent_schoolId_classGroupId_date_idx" ON "CourseContent"("schoolId", "classGroupId", "date");

-- CreateIndex
CREATE INDEX "Homework_schoolId_classGroupId_dueDate_idx" ON "Homework"("schoolId", "classGroupId", "dueDate");

-- AddForeignKey
ALTER TABLE "CourseContent" ADD CONSTRAINT "CourseContent_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
