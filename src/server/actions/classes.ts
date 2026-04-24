'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { classSchema } from '@/lib/validators/class';

export async function getClasses(schoolId: string) {
  const academicYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
  });
  if (!academicYear) return [];

  const classes = await prisma.classGroup.findMany({
    where: { schoolId, academicYearId: academicYear.id },
    include: {
      level: { select: { id: true, label: true } },
      mainTeacher: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
      schedules: { select: { id: true, timeSlot: true, startTime: true, endTime: true, room: true } },
      _count: { select: { students: true } },
    },
    orderBy: { label: 'asc' },
  });

  return classes.map((c) => {
    const schedule = c.schedules[0] ?? null;
    const fillRate = c.capacity > 0 ? Math.round((c._count.students / c.capacity) * 100) : 0;

    return {
      id: c.id,
      label: c.label,
      classGender: c.classGender,
      periodType: c.periodType,
      capacity: c.capacity,
      room: c.room,
      levelId: c.level.id,
      levelLabel: c.level.label,
      teacherId: c.mainTeacherId,
      teacherName: c.mainTeacher
        ? `${c.mainTeacher.user.firstName} ${c.mainTeacher.user.lastName}`
        : null,
      schedule: schedule
        ? {
            id: schedule.id,
            timeSlot: schedule.timeSlot,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            room: schedule.room,
          }
        : null,
      studentCount: c._count.students,
      fillRate,
    };
  });
}

export type ClassRow = Awaited<ReturnType<typeof getClasses>>[number];

export async function getTeachersForSelect(schoolId: string) {
  const teachers = await prisma.teacher.findMany({
    where: { schoolId, isActive: true },
    include: {
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { user: { lastName: 'asc' } },
  });

  return teachers.map((t) => ({
    id: t.id,
    name: `${t.user.firstName} ${t.user.lastName}`,
  }));
}

export async function getLevelsForSelect(schoolId: string) {
  const levels = await prisma.level.findMany({
    where: { schoolId },
    select: { id: true, label: true },
    orderBy: { order: 'asc' },
  });
  return levels;
}

export async function createClass(data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = classSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const academicYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
  });
  if (!academicYear) return { error: 'Aucune année scolaire active.' };

  // Check label uniqueness
  const existingLabel = await prisma.classGroup.findUnique({
    where: {
      schoolId_academicYearId_label: {
        schoolId,
        academicYearId: academicYear.id,
        label: parsed.data.label,
      },
    },
  });
  if (existingLabel) {
    return { error: 'Une classe avec ce libellé existe déjà.' };
  }

  // Check teacher schedule conflict
  if (parsed.data.teacherId) {
    const conflict = await prisma.classGroup.findFirst({
      where: {
        schoolId,
        academicYearId: academicYear.id,
        mainTeacherId: parsed.data.teacherId,
        schedules: { some: { timeSlot: parsed.data.timeSlot } },
      },
      select: { label: true },
    });
    if (conflict) {
      return {
        error: `Ce professeur est déjà assigné à la classe "${conflict.label}" sur ce créneau.`,
      };
    }
  }

  // Create class + schedule in transaction
  await prisma.$transaction(async (tx) => {
    const classGroup = await tx.classGroup.create({
      data: {
        schoolId,
        levelId: parsed.data.levelId,
        academicYearId: academicYear.id,
        label: parsed.data.label,
        classGender: parsed.data.classGender,
        periodType: parsed.data.periodType,
        capacity: parsed.data.capacity,
        room: parsed.data.room || null,
        mainTeacherId: parsed.data.teacherId || null,
      },
    });

    await tx.schedule.create({
      data: {
        schoolId,
        academicYearId: academicYear.id,
        classGroupId: classGroup.id,
        timeSlot: parsed.data.timeSlot,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        room: parsed.data.room || null,
      },
    });
  });

  revalidatePath('/admin/vie-scolaire/classes');
  return { success: true };
}

export async function updateClass(id: string, data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = classSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const classGroup = await prisma.classGroup.findFirst({
    where: { id, schoolId },
    include: { schedules: true },
  });
  if (!classGroup) return { error: 'Classe introuvable.' };

  // Check label uniqueness (excluding current)
  const existingLabel = await prisma.classGroup.findFirst({
    where: {
      schoolId,
      academicYearId: classGroup.academicYearId,
      label: parsed.data.label,
      NOT: { id },
    },
  });
  if (existingLabel) {
    return { error: 'Une classe avec ce libellé existe déjà.' };
  }

  // Check teacher schedule conflict (excluding current class)
  if (parsed.data.teacherId) {
    const conflict = await prisma.classGroup.findFirst({
      where: {
        schoolId,
        academicYearId: classGroup.academicYearId,
        mainTeacherId: parsed.data.teacherId,
        schedules: { some: { timeSlot: parsed.data.timeSlot } },
        NOT: { id },
      },
      select: { label: true },
    });
    if (conflict) {
      return {
        error: `Ce professeur est déjà assigné à la classe "${conflict.label}" sur ce créneau.`,
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.classGroup.update({
      where: { id },
      data: {
        levelId: parsed.data.levelId,
        label: parsed.data.label,
        classGender: parsed.data.classGender,
        periodType: parsed.data.periodType,
        capacity: parsed.data.capacity,
        room: parsed.data.room || null,
        mainTeacherId: parsed.data.teacherId || null,
      },
    });

    const schedule = classGroup.schedules[0];
    if (schedule) {
      await tx.schedule.update({
        where: { id: schedule.id },
        data: {
          timeSlot: parsed.data.timeSlot,
          startTime: parsed.data.startTime,
          endTime: parsed.data.endTime,
          room: parsed.data.room || null,
        },
      });
    } else {
      await tx.schedule.create({
        data: {
          schoolId,
          academicYearId: classGroup.academicYearId,
          classGroupId: id,
          timeSlot: parsed.data.timeSlot,
          startTime: parsed.data.startTime,
          endTime: parsed.data.endTime,
          room: parsed.data.room || null,
        },
      });
    }
  });

  revalidatePath('/admin/vie-scolaire/classes');
  return { success: true };
}

export async function deleteClass(id: string) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const classGroup = await prisma.classGroup.findFirst({
    where: { id, schoolId },
    include: {
      _count: { select: { students: true } },
      schedules: { select: { id: true } },
    },
  });

  if (!classGroup) return { error: 'Classe introuvable.' };

  if (classGroup._count.students > 0) {
    return {
      error: `Cette classe contient ${classGroup._count.students} élève(s). Réassignez-les d'abord.`,
    };
  }

  await prisma.$transaction(async (tx) => {
    // Delete associated schedules
    for (const schedule of classGroup.schedules) {
      await tx.schedule.delete({ where: { id: schedule.id } });
    }
    await tx.classGroup.delete({ where: { id } });
  });

  revalidatePath('/admin/vie-scolaire/classes');
  return { success: true };
}
