'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { appreciationsPayloadSchema } from '@/lib/validators/appreciation';
import {
  getPeriodRange,
  periodKeyFromNumber,
  weightedAverage,
  simpleAverage,
} from '@/lib/bulletin';

export async function getAppreciationsData(classGroupId: string, period: number) {
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

  // Fetch evaluations in period to compute averages per student
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

  const allSubjectIds = Array.from(new Set(evaluations.map((e) => e.subjectId)));
  const subjectRecords = await prisma.subject.findMany({
    where: { schoolId, id: { in: allSubjectIds } },
    select: { id: true, parentId: true, label: true },
  });
  const topLevels = await prisma.subject.findMany({
    where: { schoolId, parentId: null },
    select: { id: true, label: true },
    orderBy: { label: 'asc' },
  });
  const subjectMap = new Map(subjectRecords.map((s) => [s.id, s]));
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

  // Compute subject averages per student
  const perStudent: Record<
    string,
    { subjectAverages: Record<string, number | null>; overallAverage: number | null }
  > = {};

  for (const s of classGroup.students) {
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
    perStudent[s.id] = {
      subjectAverages: subjectAvgs,
      overallAverage: simpleAverage(Object.values(subjectAvgs)),
    };
  }

  // Fetch existing appreciations
  const existing = await prisma.appreciation.findMany({
    where: {
      classGroupId,
      period,
      academicYearId: year.id,
    },
  });
  const byStudent = new Map(existing.map((a) => [a.studentId, a]));

  const subjectsForComments = topLevels;

  return {
    data: {
      classLabel: classGroup.label,
      levelLabel: classGroup.level.label,
      academicYearLabel: year.label,
      academicYearId: year.id,
      period,
      subjects: subjectsForComments.map((s) => ({ id: s.id, label: s.label })),
      students: classGroup.students.map((s) => {
        const a = byStudent.get(s.id);
        const subjectComments = (a?.subjectComments as Record<string, string> | null) ?? {};
        return {
          studentId: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          matricule: s.matricule,
          overallAverage: perStudent[s.id]?.overallAverage ?? null,
          generalComment: a?.generalComment ?? '',
          subjectComments,
        };
      }),
    },
  };
}

export type AppreciationsData = NonNullable<
  Awaited<ReturnType<typeof getAppreciationsData>>['data']
>;

export async function saveAppreciations(data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = appreciationsPayloadSchema.safeParse(data);
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

  // Validate all students belong to this class
  const students = await prisma.student.findMany({
    where: { classGroupId: d.classGroupId, schoolId },
    select: { id: true },
  });
  const validIds = new Set(students.map((s) => s.id));

  await prisma.$transaction(async (tx) => {
    for (const entry of d.entries) {
      if (!validIds.has(entry.studentId)) continue;
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
          generalComment: entry.generalComment || null,
          subjectComments: entry.subjectComments ?? {},
        },
        update: {
          generalComment: entry.generalComment || null,
          subjectComments: entry.subjectComments ?? {},
        },
      });
    }
  });

  revalidatePath('/admin/vie-scolaire/appreciations');
  revalidatePath('/admin/vie-scolaire/mentions');
  revalidatePath('/admin/vie-scolaire/bulletins');
  return { success: true };
}
