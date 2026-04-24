'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { courseContentSchema } from '@/lib/validators/course-content';

export async function getCourseContents(schoolId: string) {
  const items = await prisma.courseContent.findMany({
    where: { schoolId },
    include: {
      classGroup: {
        select: {
          id: true,
          label: true,
          level: { select: { label: true } },
          schedules: {
            select: { timeSlot: true, startTime: true, endTime: true },
            take: 1,
          },
        },
      },
      teacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
    orderBy: { date: 'desc' },
  });

  return items.map((c) => {
    const schedule = c.classGroup.schedules[0] ?? null;
    return {
      id: c.id,
      classGroupId: c.classGroupId,
      classLabel: c.classGroup.label,
      levelLabel: c.classGroup.level.label,
      teacherId: c.teacherId,
      teacherName: `${c.teacher.user.firstName} ${c.teacher.user.lastName}`,
      date: c.date.toISOString(),
      title: c.title ?? '',
      content: c.content,
      objectives: c.objectives ?? '',
      remarks: c.remarks ?? '',
      timeSlot: schedule?.timeSlot ?? null,
      startTime: schedule?.startTime ?? null,
      endTime: schedule?.endTime ?? null,
    };
  });
}

export type CourseContentRow = Awaited<ReturnType<typeof getCourseContents>>[number];

export async function getClassesForCourseContentSelect(schoolId: string) {
  const academicYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
  });
  if (!academicYear) return [];

  const classes = await prisma.classGroup.findMany({
    where: { schoolId, academicYearId: academicYear.id },
    include: {
      level: { select: { label: true } },
      mainTeacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      schedules: {
        select: { timeSlot: true, startTime: true, endTime: true },
        take: 1,
      },
    },
    orderBy: { label: 'asc' },
  });

  return classes.map((c) => {
    const schedule = c.schedules[0] ?? null;
    return {
      id: c.id,
      label: c.label,
      levelLabel: c.level.label,
      teacherId: c.mainTeacherId,
      teacherName: c.mainTeacher
        ? `${c.mainTeacher.user.firstName} ${c.mainTeacher.user.lastName}`
        : null,
      timeSlot: schedule?.timeSlot ?? null,
      startTime: schedule?.startTime ?? null,
      endTime: schedule?.endTime ?? null,
    };
  });
}

export type CourseContentClassOption = Awaited<
  ReturnType<typeof getClassesForCourseContentSelect>
>[number];

export async function getTeachersForFilter(schoolId: string) {
  const teachers = await prisma.teacher.findMany({
    where: { schoolId, isActive: true },
    include: { user: { select: { firstName: true, lastName: true } } },
    orderBy: { user: { lastName: 'asc' } },
  });
  return teachers.map((t) => ({
    id: t.id,
    name: `${t.user.firstName} ${t.user.lastName}`,
  }));
}

export async function createCourseContent(data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = courseContentSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const classGroup = await prisma.classGroup.findFirst({
    where: { id: parsed.data.classGroupId, schoolId },
    include: { schedules: { take: 1 } },
  });
  if (!classGroup) return { error: 'Classe introuvable.' };
  if (!classGroup.mainTeacherId) {
    return { error: "Cette classe n'a pas de professeur attitré." };
  }

  const schedule = classGroup.schedules[0] ?? null;

  await prisma.courseContent.create({
    data: {
      schoolId,
      classGroupId: classGroup.id,
      teacherId: classGroup.mainTeacherId,
      scheduleId: schedule?.id ?? null,
      date: parsed.data.date,
      title: parsed.data.title,
      content: parsed.data.content,
      objectives: parsed.data.objectives || null,
      remarks: parsed.data.remarks || null,
      timeSlot: schedule?.timeSlot ?? null,
      startTime: schedule?.startTime ?? null,
      endTime: schedule?.endTime ?? null,
    },
  });

  revalidatePath('/admin/vie-scolaire/contenu-cours');
  return { success: true };
}

export async function updateCourseContent(id: string, data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = courseContentSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.courseContent.findFirst({
    where: { id, schoolId },
  });
  if (!existing) return { error: 'Contenu introuvable.' };

  const classGroup = await prisma.classGroup.findFirst({
    where: { id: parsed.data.classGroupId, schoolId },
    include: { schedules: { take: 1 } },
  });
  if (!classGroup) return { error: 'Classe introuvable.' };
  if (!classGroup.mainTeacherId) {
    return { error: "Cette classe n'a pas de professeur attitré." };
  }

  const schedule = classGroup.schedules[0] ?? null;

  await prisma.courseContent.update({
    where: { id },
    data: {
      classGroupId: classGroup.id,
      teacherId: classGroup.mainTeacherId,
      scheduleId: schedule?.id ?? null,
      date: parsed.data.date,
      title: parsed.data.title,
      content: parsed.data.content,
      objectives: parsed.data.objectives || null,
      remarks: parsed.data.remarks || null,
      timeSlot: schedule?.timeSlot ?? null,
      startTime: schedule?.startTime ?? null,
      endTime: schedule?.endTime ?? null,
    },
  });

  revalidatePath('/admin/vie-scolaire/contenu-cours');
  return { success: true };
}

export async function deleteCourseContent(id: string) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const existing = await prisma.courseContent.findFirst({
    where: { id, schoolId },
  });
  if (!existing) return { error: 'Contenu introuvable.' };

  await prisma.courseContent.delete({ where: { id } });
  revalidatePath('/admin/vie-scolaire/contenu-cours');
  return { success: true };
}
