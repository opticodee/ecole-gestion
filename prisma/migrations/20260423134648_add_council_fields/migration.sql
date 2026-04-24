-- CreateEnum
CREATE TYPE "TransitionDecision" AS ENUM ('PASSAGE', 'REDOUBLEMENT', 'DEPART', 'EN_ATTENTE');

-- AlterTable
ALTER TABLE "Appreciation" ADD COLUMN     "councilDecision" TEXT,
ADD COLUMN     "councilObservation" TEXT;

-- CreateTable
CREATE TABLE "ClassTransition" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "fromClassGroupId" TEXT NOT NULL,
    "decision" "TransitionDecision" NOT NULL DEFAULT 'EN_ATTENTE',
    "toClassGroupId" TEXT,
    "toLevelId" TEXT,
    "observation" TEXT,
    "isApplied" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassTransition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassTransition_schoolId_fromClassGroupId_idx" ON "ClassTransition"("schoolId", "fromClassGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassTransition_studentId_academicYearId_key" ON "ClassTransition"("studentId", "academicYearId");

-- AddForeignKey
ALTER TABLE "ClassTransition" ADD CONSTRAINT "ClassTransition_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTransition" ADD CONSTRAINT "ClassTransition_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTransition" ADD CONSTRAINT "ClassTransition_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTransition" ADD CONSTRAINT "ClassTransition_fromClassGroupId_fkey" FOREIGN KEY ("fromClassGroupId") REFERENCES "ClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTransition" ADD CONSTRAINT "ClassTransition_toClassGroupId_fkey" FOREIGN KEY ("toClassGroupId") REFERENCES "ClassGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTransition" ADD CONSTRAINT "ClassTransition_toLevelId_fkey" FOREIGN KEY ("toLevelId") REFERENCES "Level"("id") ON DELETE SET NULL ON UPDATE CASCADE;
