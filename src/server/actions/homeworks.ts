'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { homeworkSchema } from '@/lib/validators/homework';

export async function getHomeworks(schoolId: string) {
  const items = await prisma.homework.findMany({
    where: { schoolId },
    include: {
      classGroup: {
        select: {
          id: true,
          label: true,
          level: { select: { label: true } },
        },
      },
      teacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  return items.map((h) => ({
    id: h.id,
    classGroupId: h.classGroupId,
    classLabel: h.classGroup.label,
    levelLabel: h.classGroup.level.label,
    teacherId: h.teacherId,
    teacherName: `${h.teacher.user.firstName} ${h.teacher.user.lastName}`,
    createdDate: h.createdDate.toISOString(),
    dueDate: h.dueDate.toISOString(),
    title: h.title ?? '',
    description: h.description,
    instructions: h.instructions ?? '',
  }));
}

export type HomeworkRow = Awaited<ReturnType<typeof getHomeworks>>[number];

export async function createHomework(data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = homeworkSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const classGroup = await prisma.classGroup.findFirst({
    where: { id: parsed.data.classGroupId, schoolId },
  });
  if (!classGroup) return { error: 'Classe introuvable.' };
  if (!classGroup.mainTeacherId) {
    return { error: "Cette classe n'a pas de professeur attitré." };
  }

  await prisma.homework.create({
    data: {
      schoolId,
      classGroupId: classGroup.id,
      teacherId: classGroup.mainTeacherId,
      createdDate: parsed.data.createdDate,
      dueDate: parsed.data.dueDate,
      title: parsed.data.title,
      description: parsed.data.description,
      instructions: parsed.data.instructions || null,
    },
  });

  revalidatePath('/admin/vie-scolaire/devoirs');
  return { success: true };
}

export async function updateHomework(id: string, data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = homeworkSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.homework.findFirst({
    where: { id, schoolId },
  });
  if (!existing) return { error: 'Devoir introuvable.' };

  const classGroup = await prisma.classGroup.findFirst({
    where: { id: parsed.data.classGroupId, schoolId },
  });
  if (!classGroup) return { error: 'Classe introuvable.' };
  if (!classGroup.mainTeacherId) {
    return { error: "Cette classe n'a pas de professeur attitré." };
  }

  await prisma.homework.update({
    where: { id },
    data: {
      classGroupId: classGroup.id,
      teacherId: classGroup.mainTeacherId,
      createdDate: parsed.data.createdDate,
      dueDate: parsed.data.dueDate,
      title: parsed.data.title,
      description: parsed.data.description,
      instructions: parsed.data.instructions || null,
    },
  });

  revalidatePath('/admin/vie-scolaire/devoirs');
  return { success: true };
}

export async function deleteHomework(id: string) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const existing = await prisma.homework.findFirst({
    where: { id, schoolId },
  });
  if (!existing) return { error: 'Devoir introuvable.' };

  await prisma.homework.delete({ where: { id } });
  revalidatePath('/admin/vie-scolaire/devoirs');
  return { success: true };
}
