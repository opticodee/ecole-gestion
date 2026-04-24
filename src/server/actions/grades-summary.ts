'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import {
  getPeriodRange,
  shortEvaluationLabel,
  weightedAverage,
  simpleAverage,
  computeRanks,
  type PeriodKey,
} from '@/lib/bulletin';

export async function getGradesSummaryOptions() {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const [classes, year] = await Promise.all([
    prisma.classGroup.findMany({
      where: { schoolId },
      select: {
        id: true,
        label: true,
        mainTeacher: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
        level: { select: { label: true } },
      },
      orderBy: { label: 'asc' },
    }),
    prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
      select: { id: true, label: true, startDate: true, endDate: true },
    }),
  ]);

  return {
    classes: classes.map((c) => ({
      id: c.id,
      label: c.label,
      levelLabel: c.level.label,
      mainTeacherName: c.mainTeacher
        ? `${c.mainTeacher.user.firstName} ${c.mainTeacher.user.lastName}`
        : null,
    })),
    academicYear: year
      ? {
          id: year.id,
          label: year.label,
          startDate: year.startDate.toISOString(),
          endDate: year.endDate.toISOString(),
        }
      : null,
  };
}

export type GradesSummaryOptions = Awaited<ReturnType<typeof getGradesSummaryOptions>>;

export interface EvaluationColumn {
  evaluationId: string;
  shortLabel: string;
  fullLabel: string;
  date: string;
  type: 'CONTROLE' | 'EXAMEN';
  coefficient: number;
  scale: number;
  subjectId: string;
  subSubjectId: string | null;
}

export interface SubjectBlock {
  subjectId: string;
  subjectLabel: string;
  color: string | null;
  evaluations: EvaluationColumn[];
}

export interface StudentRow {
  studentId: string;
  matricule: string;
  firstName: string;
  lastName: string;
  /** key = evaluationId, value = grade info */
  grades: Record<string, { score: number | null; isAbsent: boolean } | undefined>;
  /** key = subjectId (main), value = weighted average */
  subjectAverages: Record<string, number | null>;
  overallAverage: number | null;
  rank: number;
}

export interface GradesSummary {
  classId: string;
  classLabel: string;
  levelLabel: string;
  mainTeacherName: string | null;
  academicYearLabel: string;
  periodKey: PeriodKey;
  periodLabel: string;
  subjects: SubjectBlock[];
  rows: StudentRow[];
  classSubjectAverages: Record<string, number | null>;
  classSubjectMax: Record<string, number | null>;
  classSubjectMin: Record<string, number | null>;
  classOverallAverage: number | null;
}

export async function getGradesSummary(
  classGroupId: string,
  periodKey: PeriodKey,
): Promise<{ error?: string; data?: GradesSummary }> {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const [classGroup, year] = await Promise.all([
    prisma.classGroup.findFirst({
      where: { id: classGroupId, schoolId },
      include: {
        level: { select: { label: true } },
        mainTeacher: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
        students: {
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
          select: { id: true, matricule: true, firstName: true, lastName: true },
        },
      },
    }),
    prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
      select: { label: true, startDate: true, endDate: true },
    }),
  ]);

  if (!classGroup) return { error: 'Classe introuvable.' };
  if (!year) return { error: 'Aucune année scolaire en cours.' };

  const { start, end } = getPeriodRange(periodKey, year.startDate, year.endDate);

  const evaluations = await prisma.evaluation.findMany({
    where: {
      schoolId,
      classGroupId,
      date: { gte: start, lte: end },
    },
    include: {
      subject: { select: { id: true, label: true, color: true, parentId: true } },
      subSubject: { select: { id: true, label: true, parentId: true } },
      grades: { select: { studentId: true, score: true, isAbsent: true } },
    },
    orderBy: { date: 'asc' },
  });

  // Resolve the "main subject" (top-level) for each evaluation:
  // If evaluation.subject has no parent it IS main. If it has a parent, we walk up.
  const allSubjectIds = Array.from(
    new Set(evaluations.flatMap((e) => [e.subjectId, e.subSubjectId].filter(Boolean) as string[])),
  );
  const subjectDetails = await prisma.subject.findMany({
    where: { schoolId, id: { in: allSubjectIds } },
    select: { id: true, label: true, parentId: true, color: true },
  });
  const subjectMap = new Map(subjectDetails.map((s) => [s.id, s]));
  // Also load all top-level subjects (parentId null) so we can resolve main roots
  const topLevelSubjects = await prisma.subject.findMany({
    where: { schoolId, parentId: null },
    select: { id: true, label: true, color: true },
    orderBy: { label: 'asc' },
  });
  const topLevelMap = new Map(topLevelSubjects.map((s) => [s.id, s]));

  function mainSubjectIdFor(subjectId: string): string {
    let current = subjectMap.get(subjectId);
    let guard = 0;
    while (current?.parentId && guard < 10) {
      const parent = subjectMap.get(current.parentId) ?? topLevelMap.get(current.parentId);
      if (!parent) break;
      current = parent as typeof current;
      guard++;
    }
    return current?.id ?? subjectId;
  }

  // Group evaluations by main subject + compute short label
  type EvalWithMain = (typeof evaluations)[number] & { mainSubjectId: string };
  const evalsWithMain: EvalWithMain[] = evaluations.map((e) => ({
    ...e,
    mainSubjectId: mainSubjectIdFor(e.subjectId),
  }));

  // Build subject blocks in a stable order (same as topLevelSubjects order)
  const bySubject = new Map<string, EvalWithMain[]>();
  for (const ev of evalsWithMain) {
    if (!bySubject.has(ev.mainSubjectId)) bySubject.set(ev.mainSubjectId, []);
    bySubject.get(ev.mainSubjectId)!.push(ev);
  }

  const subjectBlocks: SubjectBlock[] = [];
  for (const top of topLevelSubjects) {
    const evs = bySubject.get(top.id);
    if (!evs || evs.length === 0) continue;
    // Per-type ordinal index for short label
    const typeCounters: Record<string, number> = { CONTROLE: 0, EXAMEN: 0 };
    const evalColumns: EvaluationColumn[] = evs
      .slice()
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((e) => {
        typeCounters[e.evaluationType] = (typeCounters[e.evaluationType] ?? 0) + 1;
        return {
          evaluationId: e.id,
          shortLabel: shortEvaluationLabel(e.evaluationType, e.date, typeCounters[e.evaluationType]),
          fullLabel: e.label,
          date: e.date.toISOString(),
          type: e.evaluationType,
          coefficient: e.coefficient,
          scale: e.scale,
          subjectId: e.subjectId,
          subSubjectId: e.subSubjectId,
        };
      });
    subjectBlocks.push({
      subjectId: top.id,
      subjectLabel: top.label,
      color: top.color,
      evaluations: evalColumns,
    });
  }

  // Build evaluation lookup by id for grade-grouping
  const evalById = new Map<string, EvalWithMain>(evalsWithMain.map((e) => [e.id, e]));

  // Build student rows
  const rowsRaw: (Omit<StudentRow, 'rank'>)[] = classGroup.students.map((s) => {
    const grades: Record<string, { score: number | null; isAbsent: boolean } | undefined> = {};
    for (const e of evalsWithMain) {
      const g = e.grades.find((x) => x.studentId === s.id);
      if (g) grades[e.id] = { score: g.score, isAbsent: g.isAbsent };
    }
    const subjectAverages: Record<string, number | null> = {};
    for (const block of subjectBlocks) {
      const relevant = block.evaluations.map((col) => {
        const e = evalById.get(col.evaluationId)!;
        const g = grades[col.evaluationId];
        return {
          coefficient: e.coefficient,
          score: g ? g.score : null,
          isAbsent: g ? g.isAbsent : false,
        };
      });
      subjectAverages[block.subjectId] = weightedAverage(relevant);
    }
    const overallAverage = simpleAverage(Object.values(subjectAverages));
    return {
      studentId: s.id,
      matricule: s.matricule,
      firstName: s.firstName,
      lastName: s.lastName,
      grades,
      subjectAverages,
      overallAverage,
    };
  });

  const ranks = computeRanks(
    rowsRaw.map((r) => ({ id: r.studentId, average: r.overallAverage })),
  );
  const rows: StudentRow[] = rowsRaw
    .map((r) => ({ ...r, rank: ranks.get(r.studentId) ?? 0 }))
    .sort((a, b) => a.rank - b.rank);

  // Class-level aggregates
  const classSubjectAverages: Record<string, number | null> = {};
  const classSubjectMax: Record<string, number | null> = {};
  const classSubjectMin: Record<string, number | null> = {};
  for (const block of subjectBlocks) {
    const avgs = rows.map((r) => r.subjectAverages[block.subjectId]).filter((v): v is number => v !== null);
    classSubjectAverages[block.subjectId] = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null;
    classSubjectMax[block.subjectId] = avgs.length ? Math.max(...avgs) : null;
    classSubjectMin[block.subjectId] = avgs.length ? Math.min(...avgs) : null;
  }
  const overallList = rows.map((r) => r.overallAverage).filter((v): v is number => v !== null);
  const classOverallAverage = overallList.length
    ? overallList.reduce((a, b) => a + b, 0) / overallList.length
    : null;

  const periodLabel =
    periodKey === 'T1'
      ? 'Trimestre 1'
      : periodKey === 'T2'
        ? 'Trimestre 2'
        : periodKey === 'T3'
          ? 'Trimestre 3'
          : 'Année complète';

  return {
    data: {
      classId: classGroup.id,
      classLabel: classGroup.label,
      levelLabel: classGroup.level.label,
      mainTeacherName: classGroup.mainTeacher
        ? `${classGroup.mainTeacher.user.firstName} ${classGroup.mainTeacher.user.lastName}`
        : null,
      academicYearLabel: year.label,
      periodKey,
      periodLabel,
      subjects: subjectBlocks,
      rows,
      classSubjectAverages,
      classSubjectMax,
      classSubjectMin,
      classOverallAverage,
    },
  };
}
