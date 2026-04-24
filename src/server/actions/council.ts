'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { councilPayloadSchema, type CouncilDecision } from '@/lib/validators/council';
import {
  computeAutoMention,
  computeRanks,
  getPeriodRange,
  periodKeyFromNumber,
  simpleAverage,
  weightedAverage,
  type MentionKey,
} from '@/lib/bulletin';

export interface CouncilRow {
  studentId: string;
  firstName: string;
  lastName: string;
  matricule: string;
  overallAverage: number | null;
  rank: number;
  absenceCount: number;
  autoMention: MentionKey | null;
  manualMention: MentionKey | null;
  effectiveMention: MentionKey | null;
  generalComment: string;
  councilDecision: CouncilDecision | null;
  councilObservation: string;
}

export interface CouncilSummary {
  classLabel: string;
  levelLabel: string;
  academicYearLabel: string;
  period: number;
  classAverage: number | null;
  attendanceRate: number | null;
  totalStudents: number;
  decisionCounts: Record<CouncilDecision, number>;
  rows: CouncilRow[];
}

export async function getCouncilData(
  classGroupId: string,
  period: number,
): Promise<{ error?: string; data?: CouncilSummary }> {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const [classGroup, year] = await Promise.all([
    prisma.classGroup.findFirst({
      where: { id: classGroupId, schoolId },
      include: {
        level: { select: { label: true } },
        students: {
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
          select: { id: true, firstName: true, lastName: true, matricule: true },
        },
      },
    }),
    prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
      select: { id: true, label: true, startDate: true, endDate: true },
    }),
  ]);

  if (!classGroup) return { error: 'Classe introuvable.' };
  if (!year) return { error: 'Aucune année scolaire en cours.' };

  const periodKey = periodKeyFromNumber(period);
  const { start, end } = getPeriodRange(periodKey, year.startDate, year.endDate);

  const evaluations = await prisma.evaluation.findMany({
    where: { schoolId, classGroupId, date: { gte: start, lte: end } },
    select: {
      id: true,
      coefficient: true,
      subjectId: true,
      grades: { select: { studentId: true, score: true, isAbsent: true } },
    },
  });

  const topLevels = await prisma.subject.findMany({
    where: { schoolId, parentId: null },
    select: { id: true, label: true },
  });
  const allSubjectIds = Array.from(new Set(evaluations.map((e) => e.subjectId)));
  const allSubjects = await prisma.subject.findMany({
    where: { schoolId, id: { in: allSubjectIds } },
    select: { id: true, parentId: true },
  });
  const subjectMap = new Map(allSubjects.map((s) => [s.id, s]));
  const topMap = new Map(topLevels.map((s) => [s.id, s]));
  function mainSubjectIdFor(subjectId: string): string {
    let current = subjectMap.get(subjectId);
    let guard = 0;
    while (current?.parentId && guard < 10) {
      const parent = subjectMap.get(current.parentId) ?? topMap.get(current.parentId);
      if (!parent) break;
      current = parent as typeof current;
      guard++;
    }
    return current?.id ?? subjectId;
  }

  // Compute overall averages
  const overallByStudent = new Map<string, number | null>();
  for (const s of classGroup.students) {
    const subjectAvgs: (number | null)[] = [];
    for (const top of topLevels) {
      const relevant = evaluations.filter((e) => mainSubjectIdFor(e.subjectId) === top.id);
      if (relevant.length === 0) continue;
      const vals = relevant.map((e) => {
        const g = e.grades.find((x) => x.studentId === s.id);
        return {
          coefficient: e.coefficient,
          score: g ? g.score : null,
          isAbsent: g ? g.isAbsent : false,
        };
      });
      subjectAvgs.push(weightedAverage(vals));
    }
    overallByStudent.set(s.id, simpleAverage(subjectAvgs));
  }

  const ranks = computeRanks(
    classGroup.students.map((s) => ({ id: s.id, average: overallByStudent.get(s.id) ?? null })),
  );

  // Attendance counts for period
  const attendances = await prisma.attendance.findMany({
    where: {
      schoolId,
      student: { classGroupId },
      date: { gte: start, lte: end },
    },
    select: { studentId: true, status: true },
  });
  const absencesByStudent = new Map<string, number>();
  for (const a of attendances) {
    if (a.status === 'ABSENT') {
      absencesByStudent.set(a.studentId, (absencesByStudent.get(a.studentId) ?? 0) + 1);
    }
  }
  const totalAttendance = attendances.length;
  const presentCount = attendances.filter((a) => a.status === 'PRESENT').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : null;

  // Existing appreciations
  const appreciations = await prisma.appreciation.findMany({
    where: { classGroupId, period, academicYearId: year.id },
  });
  const byStudent = new Map(appreciations.map((a) => [a.studentId, a]));

  const rows: CouncilRow[] = classGroup.students.map((s) => {
    const overall = overallByStudent.get(s.id) ?? null;
    const autoMention = computeAutoMention(overall);
    const a = byStudent.get(s.id);
    const manualMention = (a?.manualMention as MentionKey | null) ?? null;
    return {
      studentId: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      matricule: s.matricule,
      overallAverage: overall,
      rank: ranks.get(s.id) ?? 0,
      absenceCount: absencesByStudent.get(s.id) ?? 0,
      autoMention,
      manualMention,
      effectiveMention: manualMention ?? autoMention,
      generalComment: a?.generalComment ?? '',
      councilDecision: (a?.councilDecision as CouncilDecision | null) ?? null,
      councilObservation: a?.councilObservation ?? '',
    };
  });

  const sortedRows = [...rows].sort((a, b) => {
    if (a.overallAverage === null && b.overallAverage === null) return 0;
    if (a.overallAverage === null) return 1;
    if (b.overallAverage === null) return -1;
    return a.rank - b.rank;
  });

  const classOverall = simpleAverage([...overallByStudent.values()]);

  const decisionCounts: Record<CouncilDecision, number> = {
    NONE: 0,
    FELICITATIONS: 0,
    COMPLIMENTS: 0,
    ENCOURAGEMENTS: 0,
    MISE_EN_GARDE_TRAVAIL: 0,
    MISE_EN_GARDE_COMPORTEMENT: 0,
    AVERTISSEMENT_TRAVAIL: 0,
    AVERTISSEMENT_COMPORTEMENT: 0,
    BLAME: 0,
  };
  for (const r of rows) {
    const key = r.councilDecision ?? 'NONE';
    decisionCounts[key] = (decisionCounts[key] ?? 0) + 1;
  }

  return {
    data: {
      classLabel: classGroup.label,
      levelLabel: classGroup.level.label,
      academicYearLabel: year.label,
      period,
      classAverage: classOverall,
      attendanceRate,
      totalStudents: classGroup.students.length,
      decisionCounts,
      rows: sortedRows,
    },
  };
}

export async function saveCouncilDecisions(data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = councilPayloadSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const d = parsed.data;

  const [classGroup, year] = await Promise.all([
    prisma.classGroup.findFirst({ where: { id: d.classGroupId, schoolId } }),
    prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } }),
  ]);
  if (!classGroup) return { error: 'Classe introuvable.' };
  if (!year) return { error: 'Aucune année scolaire en cours.' };

  const students = await prisma.student.findMany({
    where: { classGroupId: d.classGroupId, schoolId },
    select: { id: true },
  });
  const validIds = new Set(students.map((s) => s.id));

  await prisma.$transaction(async (tx) => {
    for (const entry of d.entries) {
      if (!validIds.has(entry.studentId)) continue;
      const decision = entry.councilDecision === 'NONE' ? null : entry.councilDecision;
      await tx.appreciation.upsert({
        where: {
          studentId_classGroupId_period_academicYearId: {
            studentId: entry.studentId,
            classGroupId: d.classGroupId,
            period: d.period,
            academicYearId: year.id,
          },
        },
        create: {
          schoolId,
          studentId: entry.studentId,
          classGroupId: d.classGroupId,
          period: d.period,
          academicYearId: year.id,
          councilDecision: decision ?? null,
          councilObservation: entry.councilObservation || null,
        },
        update: {
          councilDecision: decision ?? null,
          councilObservation: entry.councilObservation || null,
        },
      });
    }
  });

  revalidatePath('/admin/vie-scolaire/conseil-classe');
  revalidatePath('/admin/vie-scolaire/bulletins');
  return { success: true };
}
