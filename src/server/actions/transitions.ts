'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import {
  transitionsPayloadSchema,
  type TransitionDecisionValue,
} from '@/lib/validators/transition';
import {
  computeAutoMention,
  computeRanks,
  simpleAverage,
  weightedAverage,
  type MentionKey,
} from '@/lib/bulletin';

export interface TransitionOptionsClass {
  id: string;
  label: string;
  classGender: 'FILLE' | 'GARCON' | 'MIXTE';
  capacity: number;
  studentCount: number;
  levelId: string;
  levelLabel: string;
  levelOrder: number;
}

export interface TransitionOptions {
  classes: { id: string; label: string; levelLabel: string }[];
  targetClasses: TransitionOptionsClass[];
  levels: { id: string; label: string; order: number }[];
  academicYear: { id: string; label: string } | null;
}

export async function getTransitionOptions(): Promise<TransitionOptions> {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const [classes, levels, year] = await Promise.all([
    prisma.classGroup.findMany({
      where: { schoolId },
      select: {
        id: true,
        label: true,
        classGender: true,
        capacity: true,
        levelId: true,
        level: { select: { id: true, label: true, order: true } },
        _count: { select: { students: true } },
      },
      orderBy: { label: 'asc' },
    }),
    prisma.level.findMany({
      where: { schoolId },
      select: { id: true, label: true, order: true },
      orderBy: { order: 'asc' },
    }),
    prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
      select: { id: true, label: true },
    }),
  ]);

  return {
    classes: classes.map((c) => ({
      id: c.id,
      label: c.label,
      levelLabel: c.level.label,
    })),
    targetClasses: classes.map((c) => ({
      id: c.id,
      label: c.label,
      classGender: c.classGender,
      capacity: c.capacity,
      studentCount: c._count.students,
      levelId: c.levelId,
      levelLabel: c.level.label,
      levelOrder: c.level.order,
    })),
    levels,
    academicYear: year,
  };
}

export interface TransitionRow {
  studentId: string;
  firstName: string;
  lastName: string;
  matricule: string;
  gender: 'MALE' | 'FEMALE';
  yearAverage: number | null;
  yearRank: number;
  yearMention: MentionKey | null;
  currentLevelId: string;
  currentLevelLabel: string;
  decision: TransitionDecisionValue;
  toClassGroupId: string | null;
  toLevelId: string | null;
  observation: string;
  suggestedLevelId: string | null;
}

export interface TransitionData {
  classLabel: string;
  classGender: 'FILLE' | 'GARCON' | 'MIXTE';
  levelLabel: string;
  academicYearLabel: string;
  totalStudents: number;
  decisionCounts: Record<TransitionDecisionValue, number>;
  isApplied: boolean;
  rows: TransitionRow[];
}

export async function getTransitionsData(
  classGroupId: string,
): Promise<{ error?: string; data?: TransitionData }> {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const [classGroup, year] = await Promise.all([
    prisma.classGroup.findFirst({
      where: { id: classGroupId, schoolId },
      include: {
        level: { select: { id: true, label: true, order: true } },
        students: {
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
          select: { id: true, firstName: true, lastName: true, matricule: true, gender: true },
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

  // Pull all evaluations for the whole year (T1+T2+T3)
  const evaluations = await prisma.evaluation.findMany({
    where: {
      schoolId,
      classGroupId,
      date: { gte: year.startDate, lte: year.endDate },
    },
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

  // Existing transitions for this year
  const existing = await prisma.classTransition.findMany({
    where: {
      schoolId,
      academicYearId: year.id,
      student: { classGroupId },
    },
  });
  const byStudent = new Map(existing.map((t) => [t.studentId, t]));

  // Suggest next level by `order+1`
  const allLevels = await prisma.level.findMany({
    where: { schoolId },
    select: { id: true, order: true },
    orderBy: { order: 'asc' },
  });
  const nextLevelId =
    allLevels.find((l) => l.order === classGroup.level.order + 1)?.id ?? null;

  const rows: TransitionRow[] = classGroup.students.map((s) => {
    const t = byStudent.get(s.id);
    const avg = overallByStudent.get(s.id) ?? null;
    return {
      studentId: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      matricule: s.matricule,
      gender: s.gender,
      yearAverage: avg,
      yearRank: ranks.get(s.id) ?? 0,
      yearMention: computeAutoMention(avg),
      currentLevelId: classGroup.level.id,
      currentLevelLabel: classGroup.level.label,
      decision: (t?.decision as TransitionDecisionValue | undefined) ?? 'EN_ATTENTE',
      toClassGroupId: t?.toClassGroupId ?? null,
      toLevelId: t?.toLevelId ?? nextLevelId,
      observation: t?.observation ?? '',
      suggestedLevelId: nextLevelId,
    };
  });

  const sortedRows = rows.sort((a, b) => {
    if (a.yearAverage === null && b.yearAverage === null) return 0;
    if (a.yearAverage === null) return 1;
    if (b.yearAverage === null) return -1;
    return a.yearRank - b.yearRank;
  });

  const decisionCounts: Record<TransitionDecisionValue, number> = {
    EN_ATTENTE: 0,
    PASSAGE: 0,
    REDOUBLEMENT: 0,
    DEPART: 0,
  };
  for (const r of sortedRows) {
    decisionCounts[r.decision] = (decisionCounts[r.decision] ?? 0) + 1;
  }

  const isApplied = existing.every((t) => t.isApplied) && existing.length > 0;

  return {
    data: {
      classLabel: classGroup.label,
      classGender: classGroup.classGender,
      levelLabel: classGroup.level.label,
      academicYearLabel: year.label,
      totalStudents: classGroup.students.length,
      decisionCounts,
      isApplied,
      rows: sortedRows,
    },
  };
}

export async function saveTransitions(data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = transitionsPayloadSchema.safeParse(data);
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

      const toClassGroupId =
        entry.decision === 'PASSAGE' ? (entry.toClassGroupId ?? null) : null;
      const toLevelId =
        entry.decision === 'PASSAGE' ? (entry.toLevelId ?? null) : null;

      const existing = await tx.classTransition.findUnique({
        where: {
          studentId_academicYearId: {
            studentId: entry.studentId,
            academicYearId: year.id,
          },
        },
      });
      // Cannot edit an already-applied transition
      if (existing?.isApplied) continue;

      if (existing) {
        await tx.classTransition.update({
          where: { id: existing.id },
          data: {
            decision: entry.decision,
            toClassGroupId,
            toLevelId,
            observation: entry.observation || null,
          },
        });
      } else {
        await tx.classTransition.create({
          data: {
            schoolId,
            studentId: entry.studentId,
            academicYearId: year.id,
            fromClassGroupId: d.classGroupId,
            decision: entry.decision,
            toClassGroupId,
            toLevelId,
            observation: entry.observation || null,
          },
        });
      }
    }
  });

  revalidatePath('/admin/vie-scolaire/passage');
  return { success: true };
}

function isGenderCompatible(
  studentGender: 'MALE' | 'FEMALE',
  classGender: 'FILLE' | 'GARCON' | 'MIXTE',
): boolean {
  if (classGender === 'MIXTE') return true;
  if (studentGender === 'MALE') return classGender === 'GARCON';
  return classGender === 'FILLE';
}

export async function applyTransitions(classGroupId: string) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const [classGroup, year] = await Promise.all([
    prisma.classGroup.findFirst({ where: { id: classGroupId, schoolId } }),
    prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } }),
  ]);
  if (!classGroup) return { error: 'Classe introuvable.' };
  if (!year) return { error: 'Aucune année scolaire en cours.' };

  const transitions = await prisma.classTransition.findMany({
    where: {
      schoolId,
      fromClassGroupId: classGroupId,
      academicYearId: year.id,
    },
    include: {
      student: { select: { id: true, gender: true, firstName: true, lastName: true } },
      toClassGroup: {
        include: { _count: { select: { students: true } } },
      },
    },
  });

  const pending = transitions.filter((t) => t.decision === 'EN_ATTENTE');
  if (pending.length > 0) {
    return { error: `Il reste ${pending.length} élève(s) « en attente ». Traitez-les avant d'appliquer.` };
  }
  const alreadyApplied = transitions.filter((t) => t.isApplied);
  if (alreadyApplied.length > 0) {
    return { error: 'Certaines décisions ont déjà été appliquées — rechargez la page.' };
  }

  // Validate capacity + gender for each PASSAGE
  const capacityPlanned = new Map<string, number>();
  for (const t of transitions) {
    if (t.decision !== 'PASSAGE') continue;
    if (!t.toClassGroupId || !t.toClassGroup) {
      return {
        error: `L'élève ${t.student.firstName} ${t.student.lastName} est marqué PASSAGE mais n'a pas de classe cible.`,
      };
    }
    if (!isGenderCompatible(t.student.gender, t.toClassGroup.classGender)) {
      return {
        error: `Genre incompatible pour ${t.student.firstName} ${t.student.lastName} vers "${t.toClassGroup.label}".`,
      };
    }
    const planned = capacityPlanned.get(t.toClassGroupId) ?? 0;
    capacityPlanned.set(t.toClassGroupId, planned + 1);
    const available =
      t.toClassGroup.capacity - t.toClassGroup._count.students - planned;
    if (available < 1) {
      return {
        error: `La classe "${t.toClassGroup.label}" n'a pas assez de places pour accueillir tous les élèves prévus.`,
      };
    }
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    for (const t of transitions) {
      if (t.decision === 'PASSAGE' && t.toClassGroupId) {
        await tx.student.update({
          where: { id: t.studentId },
          data: { classGroupId: t.toClassGroupId },
        });
      } else if (t.decision === 'DEPART') {
        await tx.student.update({
          where: { id: t.studentId },
          data: { status: 'RADIE' },
        });
      }
      // REDOUBLEMENT : nothing to change (same class, will re-inscribe next year)
      await tx.classTransition.update({
        where: { id: t.id },
        data: { isApplied: true, appliedAt: now },
      });
    }
  });

  revalidatePath('/admin/vie-scolaire/passage');
  revalidatePath('/admin/vie-scolaire/eleves');
  revalidatePath('/admin/vie-scolaire/classes');
  return { success: true };
}
