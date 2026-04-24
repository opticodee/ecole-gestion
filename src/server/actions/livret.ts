'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import {
  computeAutoMention,
  computeRanks,
  getPeriodRange,
  simpleAverage,
  weightedAverage,
  type MentionKey,
} from '@/lib/bulletin';
import type { CouncilDecision } from '@/lib/validators/council';

export async function getLivretStudents() {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;
  const students = await prisma.student.findMany({
    where: { schoolId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      matricule: true,
      classGroup: { select: { label: true } },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
  return students.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    matricule: s.matricule,
    classLabel: s.classGroup.label,
  }));
}

export type LivretStudent = Awaited<ReturnType<typeof getLivretStudents>>[number];

export interface LivretSubjectAverage {
  subjectId: string;
  subjectLabel: string;
  average: number | null;
  comment: string;
}

export interface LivretTrimester {
  period: number;
  subjectAverages: LivretSubjectAverage[];
  overallAverage: number | null;
  mention: MentionKey | null;
  manualMention: MentionKey | null;
  rank: number | null;
  totalStudents: number;
  absenceCount: number;
  generalComment: string;
  councilDecision: CouncilDecision | null;
  councilObservation: string;
}

export interface LivretYear {
  academicYearLabel: string;
  classLabel: string;
  levelLabel: string;
  teacherName: string | null;
  trimesters: LivretTrimester[];
  yearAverage: number | null;
}

export interface LivretData {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string;
    dateOfBirth: string;
    gender: string;
    currentClassLabel: string;
    currentLevelLabel: string;
  };
  years: LivretYear[];
}

export async function getLivretData(
  studentId: string,
): Promise<{ error?: string; data?: LivretData }> {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    include: {
      classGroup: {
        select: {
          id: true,
          label: true,
          academicYearId: true,
          level: { select: { label: true } },
          mainTeacher: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      },
    },
  });
  if (!student) return { error: 'Élève introuvable.' };

  // For v0.1 we only track the current academic year — loop over all current/past
  // academic years that exist for this school.
  const academicYears = await prisma.academicYear.findMany({
    where: { schoolId },
    orderBy: { startDate: 'desc' },
  });

  const topLevels = await prisma.subject.findMany({
    where: { schoolId, parentId: null },
    select: { id: true, label: true },
    orderBy: { label: 'asc' },
  });

  const allSubjects = await prisma.subject.findMany({
    where: { schoolId },
    select: { id: true, parentId: true },
  });
  const subjectMap = new Map(allSubjects.map((s) => [s.id, s]));
  function mainSubjectIdFor(subjectId: string): string {
    let current = subjectMap.get(subjectId);
    let guard = 0;
    while (current?.parentId && guard < 10) {
      const parent = subjectMap.get(current.parentId);
      if (!parent) break;
      current = parent;
      guard++;
    }
    return current?.id ?? subjectId;
  }

  const years: LivretYear[] = [];

  for (const year of academicYears) {
    // The student lived in this year if there exists any evaluation or appreciation for them tied to it.
    // For v0.1 the student has exactly one class in the current year.
    const classGroup = await prisma.classGroup.findFirst({
      where: {
        schoolId,
        academicYearId: year.id,
        students: { some: { id: student.id } },
      },
      include: {
        level: { select: { label: true } },
        mainTeacher: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        students: { select: { id: true } },
      },
    });
    if (!classGroup) continue;

    const classStudentIds = classGroup.students.map((s) => s.id);
    const teacherName = classGroup.mainTeacher
      ? `${classGroup.mainTeacher.user.firstName} ${classGroup.mainTeacher.user.lastName}`
      : null;

    const trimesters: LivretTrimester[] = [];

    for (const period of [1, 2, 3] as const) {
      const periodKey = period === 1 ? 'T1' : period === 2 ? 'T2' : 'T3';
      const { start, end } = getPeriodRange(periodKey, year.startDate, year.endDate);

      const evaluations = await prisma.evaluation.findMany({
        where: {
          schoolId,
          classGroupId: classGroup.id,
          date: { gte: start, lte: end },
        },
        select: {
          id: true,
          coefficient: true,
          subjectId: true,
          grades: { select: { studentId: true, score: true, isAbsent: true } },
        },
      });

      // Per-student weighted avg per main subject
      function subjectAvgsFor(sid: string) {
        const out: Record<string, number | null> = {};
        for (const top of topLevels) {
          const relevant = evaluations.filter((e) => mainSubjectIdFor(e.subjectId) === top.id);
          if (relevant.length === 0) {
            out[top.id] = null;
            continue;
          }
          out[top.id] = weightedAverage(
            relevant.map((e) => {
              const g = e.grades.find((x) => x.studentId === sid);
              return {
                coefficient: e.coefficient,
                score: g ? g.score : null,
                isAbsent: g ? g.isAbsent : false,
              };
            }),
          );
        }
        return out;
      }

      const studentSubjectAvgs = subjectAvgsFor(student.id);
      const overall = simpleAverage(Object.values(studentSubjectAvgs));

      // Rank: compute for all students in class this period
      const overallByStudent = new Map<string, number | null>();
      for (const sid of classStudentIds) {
        const avgs = subjectAvgsFor(sid);
        overallByStudent.set(sid, simpleAverage(Object.values(avgs)));
      }
      const ranks = computeRanks(
        classStudentIds.map((sid) => ({ id: sid, average: overallByStudent.get(sid) ?? null })),
      );

      // Attendance
      const attendances = await prisma.attendance.count({
        where: {
          schoolId,
          studentId: student.id,
          status: 'ABSENT',
          date: { gte: start, lte: end },
        },
      });

      // Appreciation
      const appreciation = await prisma.appreciation.findFirst({
        where: {
          studentId: student.id,
          classGroupId: classGroup.id,
          period,
          academicYearId: year.id,
        },
      });

      const subjectComments = (appreciation?.subjectComments as Record<string, string> | null) ?? {};
      const subjectAverages: LivretSubjectAverage[] = topLevels
        .map((t) => ({
          subjectId: t.id,
          subjectLabel: t.label,
          average: studentSubjectAvgs[t.id] ?? null,
          comment: subjectComments[t.id] ?? '',
        }))
        .filter((s) => s.average !== null || s.comment);

      const manualMention = (appreciation?.manualMention as MentionKey | null) ?? null;
      const autoMention = computeAutoMention(overall);

      // Only push a trimester row if there's data (grades or appreciation)
      if (subjectAverages.length === 0 && !appreciation && attendances === 0) continue;

      trimesters.push({
        period,
        subjectAverages,
        overallAverage: overall,
        mention: manualMention ?? autoMention,
        manualMention,
        rank: overall === null ? null : (ranks.get(student.id) ?? null),
        totalStudents: classStudentIds.length,
        absenceCount: attendances,
        generalComment: appreciation?.generalComment ?? '',
        councilDecision: (appreciation?.councilDecision as CouncilDecision | null) ?? null,
        councilObservation: appreciation?.councilObservation ?? '',
      });
    }

    const yearAverage = simpleAverage(
      trimesters.map((t) => t.overallAverage).filter((v): v is number => v !== null),
    );

    if (trimesters.length > 0) {
      years.push({
        academicYearLabel: year.label,
        classLabel: classGroup.label,
        levelLabel: classGroup.level.label,
        teacherName,
        trimesters,
        yearAverage,
      });
    }
  }

  return {
    data: {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        matricule: student.matricule,
        dateOfBirth: student.dateOfBirth.toISOString(),
        gender: student.gender,
        currentClassLabel: student.classGroup.label,
        currentLevelLabel: student.classGroup.level.label,
      },
      years,
    },
  };
}
