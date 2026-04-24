-- CreateTable
CREATE TABLE "Appreciation" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classGroupId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "period" INTEGER NOT NULL,
    "generalComment" TEXT,
    "subjectComments" JSONB,
    "autoMention" TEXT,
    "manualMention" TEXT,
    "councilComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appreciation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Appreciation_schoolId_classGroupId_period_idx" ON "Appreciation"("schoolId", "classGroupId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Appreciation_studentId_classGroupId_period_academicYearId_key" ON "Appreciation"("studentId", "classGroupId", "period", "academicYearId");

-- AddForeignKey
ALTER TABLE "Appreciation" ADD CONSTRAINT "Appreciation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appreciation" ADD CONSTRAINT "Appreciation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appreciation" ADD CONSTRAINT "Appreciation_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appreciation" ADD CONSTRAINT "Appreciation_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
