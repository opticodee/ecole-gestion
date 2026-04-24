'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { mentionsPayloadSchema } from '@/lib/validators/mention';
import {
  computeAutoMention,
  getPeriodRange,
  periodKeyFromNumber,
  simpleAverage,
  weightedAverage,
  type MentionKey,
} from '@/lib/bulletin';

export async function getMentionsData(classGroupId: string, period: number) {
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
    where: {
      schoolId,
      classGroupId,
      date: { gte: start, lte: end },
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

  const existing = await prisma.appreciation.findMany({
    where: {
      classGroupId,
      period,
      academicYearId: year.id,
    },
  });
  const byStudent = new Map(existing.map((a) => [a.studentId, a]));

  const rows = classGroup.students.map((s) => {
    const subjectAvgs: Record<string, number | null> = {};
    for (const top of topLevels) {
      const relevantEvals = evaluations.filter((e) => mainSubjectIdFor(e.subjectId) === top.id);
      if (relevantEvals.length === 0) {
        subjectAvgs[top.id] = null;
        continue;
      }
      const vals = relevantEvals.map((e) => {
        const g = e.grades.find((x) => x.studentId === s.id);
        return {
          coefficient: e.coefficient,
          score: g ? g.score : null,
          isAbsent: g ? g.isAbsent : false,
        };
      });
      subjectAvgs[top.id] = weightedAverage(vals);
    }
    const overall = simpleAverage(Object.values(subjectAvgs));
    const autoMention = computeAutoMention(overall);
    const a = byStudent.get(s.id);
    return {
      studentId: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      matricule: s.matricule,
      overallAverage: overall,
      autoMention,
      manualMention: (a?.manualMention as MentionKey | null) ?? null,
      councilComment: a?.councilComment ?? '',
    };
  });

  return {
    data: {
      classLabel: classGroup.label,
      levelLabel: classGroup.level.label,
      academicYearLabel: year.label,
      academicYearId: year.id,
      period,
      rows,
    },
  };
}

export type MentionsData = NonNullable<Awaited<ReturnType<typeof getMentionsData>>['data']>;

export async function saveMentions(data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = mentionsPayloadSchema.safeParse(data);
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
    select: { id: true, classGroupId: true },
  });
  const validIds = new Set(students.map((s) => s.id));

  // For recomputing the auto mention at save time we need current evaluations
  const periodKey = periodKeyFromNumber(d.period);
  const { start, end } = getPeriodRange(periodKey, year.startDate, year.endDate);
  const evaluations = await prisma.evaluation.findMany({
    where: {
      schoolId,
      classGroupId: d.classGroupId,
      date: { gte: start, lte: end },
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
    select: { id: true },
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

  await prisma.$transaction(async (tx) => {
    for (const entry of d.entries) {
      if (!validIds.has(entry.studentId)) continue;

      const subjectAvgs: Record<string, number | null> = {};
      for (const top of topLevels) {
        const relevantEvals = evaluations.filter((e) => mainSubjectIdFor(e.subjectId) === top.id);
        if (relevantEvals.length === 0) {
          subjectAvgs[top.id] = null;
          continue;
        }
        subjectAvgs[top.id] = weightedAverage(
          relevantEvals.map((e) => {
            const g = e.grades.find((x) => x.studentId === entry.studentId);
            return {
              coefficient: e.coefficient,
              score: g ? g.score : null,
              isAbsent: g ? g.isAbsent : false,
            };
          }),
        );
      }
      const overall = simpleAverage(Object.values(subjectAvgs));
      const autoMention = computeAutoMention(overall);

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
          autoMention,
          manualMention: entry.manualMention ?? null,
          councilComment: entry.councilComment || null,
        },
        update: {
          autoMention,
          manualMention: entry.manualMention ?? null,
          councilComment: entry.councilComment || null,
        },
      });
    }
  });

  revalidatePath('/admin/vie-scolaire/mentions');
  revalidatePath('/admin/vie-scolaire/bulletins');
  return { success: true };
}
