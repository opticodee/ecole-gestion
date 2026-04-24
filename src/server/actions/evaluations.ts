'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { evaluationSchema } from '@/lib/validators/evaluation';

export async function getEvaluations(schoolId: string) {
  const items = await prisma.evaluation.findMany({
    where: { schoolId },
    include: {
      classGroup: { select: { id: true, label: true } },
      subject: { select: { id: true, label: true } },
      subSubject: { select: { id: true, label: true } },
      teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      student: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { grades: true } },
    },
    orderBy: { date: 'desc' },
  });

  return items.map((e) => ({
    id: e.id,
    label: e.label,
    mode: e.mode,
    groupType: e.groupType,
    evaluationType: e.evaluationType,
    date: e.date.toISOString(),
    coefficient: e.coefficient,
    scale: e.scale,
    isLocked: e.isLocked,
    classGroupId: e.classGroupId,
    classLabel: e.classGroup.label,
    teacherId: e.teacherId,
    teacherName: `${e.teacher.user.firstName} ${e.teacher.user.lastName}`,
    subjectId: e.subjectId,
    subjectLabel: e.subject.label,
    subSubjectId: e.subSubjectId,
    subSubjectLabel: e.subSubject?.label ?? null,
    studentId: e.studentId,
    studentName: e.student ? `${e.student.firstName} ${e.student.lastName}` : null,
    gradesCount: e._count.grades,
  }));
}

export type EvaluationRow = Awaited<ReturnType<typeof getEvaluations>>[number];

export async function getEvaluationById(id: string) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const e = await prisma.evaluation.findFirst({
    where: { id, schoolId },
    include: {
      classGroup: {
        select: {
          id: true,
          label: true,
          students: {
            select: { id: true, firstName: true, lastName: true, matricule: true },
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
          },
        },
      },
      subject: { select: { id: true, label: true } },
      subSubject: { select: { id: true, label: true } },
      teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      grades: true,
    },
  });

  if (!e) return null;

  return {
    id: e.id,
    label: e.label,
    mode: e.mode,
    groupType: e.groupType,
    evaluationType: e.evaluationType,
    date: e.date.toISOString(),
    coefficient: e.coefficient,
    scale: e.scale,
    isLocked: e.isLocked,
    classGroupId: e.classGroupId,
    classLabel: e.classGroup.label,
    teacherId: e.teacherId,
    teacherName: `${e.teacher.user.firstName} ${e.teacher.user.lastName}`,
    subjectId: e.subjectId,
    subjectLabel: e.subject.label,
    subSubjectId: e.subSubjectId,
    subSubjectLabel: e.subSubject?.label ?? null,
    students: e.classGroup.students,
    grades: e.grades.map((g) => ({
      id: g.id,
      studentId: g.studentId,
      score: g.score,
      isAbsent: g.isAbsent,
    })),
  };
}

export type EvaluationDetail = NonNullable<Awaited<ReturnType<typeof getEvaluationById>>>;

export async function getEvaluationOptions(schoolId: string) {
  const [classes, subjects, teachers] = await Promise.all([
    prisma.classGroup.findMany({
      where: { schoolId },
      select: {
        id: true,
        label: true,
        mainTeacherId: true,
        mainTeacher: {
          select: { id: true, user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { label: 'asc' },
    }),
    prisma.subject.findMany({
      where: { schoolId },
      select: { id: true, label: true, parentId: true },
      orderBy: [{ parentId: 'asc' }, { label: 'asc' }],
    }),
    prisma.teacher.findMany({
      where: { schoolId, isActive: true },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { user: { lastName: 'asc' } },
    }),
  ]);

  return {
    classes: classes.map((c) => ({
      id: c.id,
      label: c.label,
      mainTeacherId: c.mainTeacherId,
      mainTeacherName: c.mainTeacher
        ? `${c.mainTeacher.user.firstName} ${c.mainTeacher.user.lastName}`
        : null,
    })),
    subjects: subjects.map((s) => ({
      id: s.id,
      label: s.label,
      parentId: s.parentId,
    })),
    teachers: teachers.map((t) => ({
      id: t.id,
      name: `${t.user.firstName} ${t.user.lastName}`,
    })),
  };
}

export type EvaluationOptions = Awaited<ReturnType<typeof getEvaluationOptions>>;

export async function createEvaluation(data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = evaluationSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const d = parsed.data;

  const [classGroup, subject, teacher] = await Promise.all([
    prisma.classGroup.findFirst({ where: { id: d.classGroupId, schoolId } }),
    prisma.subject.findFirst({ where: { id: d.subjectId, schoolId } }),
    prisma.teacher.findFirst({ where: { id: d.teacherId, schoolId } }),
  ]);
  if (!classGroup) return { error: 'Classe introuvable.' };
  if (!subject) return { error: 'Matière introuvable.' };
  if (!teacher) return { error: 'Enseignant introuvable.' };

  if (d.subSubjectId) {
    const sub = await prisma.subject.findFirst({
      where: { id: d.subSubjectId, schoolId, parentId: d.subjectId },
    });
    if (!sub) return { error: 'Sous-matière invalide pour cette matière.' };
  }

  if (d.mode === 'INDIVIDUAL' && d.studentId) {
    const student = await prisma.student.findFirst({
      where: { id: d.studentId, schoolId, classGroupId: d.classGroupId },
    });
    if (!student) return { error: "Élève introuvable dans cette classe." };
  }

  await prisma.evaluation.create({
    data: {
      schoolId,
      classGroupId: d.classGroupId,
      teacherId: d.teacherId,
      subjectId: d.subjectId,
      subSubjectId: d.subSubjectId || null,
      studentId: d.mode === 'INDIVIDUAL' ? (d.studentId || null) : null,
      label: d.label,
      mode: d.mode,
      groupType: d.mode === 'GROUP' ? (d.groupType || null) : null,
      evaluationType: d.evaluationType,
      coefficient: d.coefficient,
      scale: d.scale,
      date: d.date,
      isLocked: false,
    },
  });

  revalidatePath('/admin/vie-scolaire/evaluations');
  return { success: true };
}

export async function updateEvaluation(id: string, data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const existing = await prisma.evaluation.findFirst({ where: { id, schoolId } });
  if (!existing) return { error: 'Évaluation introuvable.' };
  if (existing.isLocked) {
    return { error: 'Évaluation verrouillée — modification impossible.' };
  }

  const parsed = evaluationSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const d = parsed.data;

  const [classGroup, subject, teacher] = await Promise.all([
    prisma.classGroup.findFirst({ where: { id: d.classGroupId, schoolId } }),
    prisma.subject.findFirst({ where: { id: d.subjectId, schoolId } }),
    prisma.teacher.findFirst({ where: { id: d.teacherId, schoolId } }),
  ]);
  if (!classGroup) return { error: 'Classe introuvable.' };
  if (!subject) return { error: 'Matière introuvable.' };
  if (!teacher) return { error: 'Enseignant introuvable.' };

  if (d.subSubjectId) {
    const sub = await prisma.subject.findFirst({
      where: { id: d.subSubjectId, schoolId, parentId: d.subjectId },
    });
    if (!sub) return { error: 'Sous-matière invalide pour cette matière.' };
  }

  await prisma.evaluation.update({
    where: { id },
    data: {
      classGroupId: d.classGroupId,
      teacherId: d.teacherId,
      subjectId: d.subjectId,
      subSubjectId: d.subSubjectId || null,
      studentId: d.mode === 'INDIVIDUAL' ? (d.studentId || null) : null,
      label: d.label,
      mode: d.mode,
      groupType: d.mode === 'GROUP' ? (d.groupType || null) : null,
      evaluationType: d.evaluationType,
      coefficient: d.coefficient,
      scale: d.scale,
      date: d.date,
    },
  });

  revalidatePath('/admin/vie-scolaire/evaluations');
  revalidatePath(`/admin/vie-scolaire/evaluations/${id}/notes`);
  return { success: true };
}

export async function deleteEvaluation(id: string) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const existing = await prisma.evaluation.findFirst({ where: { id, schoolId } });
  if (!existing) return { error: 'Évaluation introuvable.' };
  if (existing.isLocked) {
    return { error: 'Évaluation verrouillée — suppression impossible.' };
  }

  await prisma.evaluation.delete({ where: { id } });
  revalidatePath('/admin/vie-scolaire/evaluations');
  return { success: true };
}
