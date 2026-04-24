'use server';

import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { teacherSchema } from '@/lib/validators/teacher';

export async function getTeachers(schoolId: string) {
  const teachers = await prisma.teacher.findMany({
    where: { schoolId },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      classGroups: {
        select: { id: true, label: true, classGender: true },
        orderBy: { label: 'asc' },
      },
    },
    orderBy: { user: { lastName: 'asc' } },
  });

  return teachers.map((t) => ({
    id: t.id,
    userId: t.userId,
    gender: t.gender,
    firstName: t.user.firstName,
    lastName: t.user.lastName,
    email: t.user.email,
    phone: t.phone,
    specialization: t.specialization,
    isActive: t.isActive,
    classes: t.classGroups.map((c) => ({
      id: c.id,
      label: c.label,
      classGender: c.classGender,
    })),
    classCount: t.classGroups.length,
  }));
}

export type TeacherRow = Awaited<ReturnType<typeof getTeachers>>[number];

export async function getTeacherById(id: string, schoolId: string) {
  const teacher = await prisma.teacher.findFirst({
    where: { id, schoolId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
      classGroups: {
        select: {
          id: true,
          label: true,
          classGender: true,
          capacity: true,
          level: { select: { label: true } },
          schedules: {
            select: { timeSlot: true, startTime: true, endTime: true, room: true },
          },
          _count: { select: { students: true } },
        },
        orderBy: { label: 'asc' },
      },
    },
  });

  if (!teacher) return null;

  // Stats: total evaluations + attendance rate across this teacher's classes
  const classIds = teacher.classGroups.map((c) => c.id);

  const [evalCount, attendanceRows] = await Promise.all([
    prisma.evaluation.count({
      where: { schoolId, teacherId: teacher.id },
    }),
    classIds.length > 0
      ? prisma.attendance.groupBy({
          by: ['status'],
          where: {
            schoolId,
            student: { classGroupId: { in: classIds } },
          },
          _count: true,
        })
      : Promise.resolve([]),
  ]);

  let presenceRate: number | null = null;
  const total = attendanceRows.reduce((acc, r) => acc + (r._count as number), 0);
  if (total > 0) {
    const present = attendanceRows.find((r) => r.status === 'PRESENT')?._count ?? 0;
    presenceRate = Math.round((Number(present) / total) * 100);
  }

  const totalStudents = teacher.classGroups.reduce((acc, c) => acc + c._count.students, 0);

  return {
    id: teacher.id,
    userId: teacher.userId,
    gender: teacher.gender,
    firstName: teacher.user.firstName,
    lastName: teacher.user.lastName,
    email: teacher.user.email,
    phone: teacher.phone,
    address: teacher.address,
    dateOfBirth: teacher.dateOfBirth ? teacher.dateOfBirth.toISOString() : null,
    specialization: teacher.specialization,
    isActive: teacher.isActive,
    hireDate: teacher.hireDate ? teacher.hireDate.toISOString() : null,
    lastLoginAt: teacher.user.lastLoginAt ? teacher.user.lastLoginAt.toISOString() : null,
    createdAt: teacher.user.createdAt.toISOString(),
    classes: teacher.classGroups.map((c) => {
      const schedule = c.schedules[0] ?? null;
      return {
        id: c.id,
        label: c.label,
        classGender: c.classGender,
        capacity: c.capacity,
        levelLabel: c.level.label,
        studentCount: c._count.students,
        schedule: schedule
          ? {
              timeSlot: schedule.timeSlot,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              room: schedule.room,
            }
          : null,
      };
    }),
    stats: {
      totalStudents,
      evaluationCount: evalCount,
      presenceRate,
    },
  };
}

export type TeacherDetail = NonNullable<Awaited<ReturnType<typeof getTeacherById>>>;

export async function createTeacher(data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = teacherSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const d = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { schoolId, email: d.email.toLowerCase() },
  });
  if (existing) {
    return { error: 'Cet email est déjà utilisé par un utilisateur de l\'école.' };
  }

  // Temporary password — later replaced by invitation email workflow
  const passwordHash = await hash('ChangeMe2026!', 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        schoolId,
        email: d.email.toLowerCase(),
        passwordHash,
        role: 'PROFESSEUR',
        firstName: d.firstName,
        lastName: d.lastName,
        isActive: d.isActive,
      },
    });
    await tx.teacher.create({
      data: {
        userId: user.id,
        schoolId,
        gender: d.gender,
        phone: d.phone || null,
        address: d.address || null,
        dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : null,
        specialization: d.specialization || null,
        isActive: d.isActive,
      },
    });
  });

  revalidatePath('/admin/vie-scolaire/enseignants');
  return { success: true };
}

export async function updateTeacher(id: string, data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = teacherSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const d = parsed.data;

  const teacher = await prisma.teacher.findFirst({
    where: { id, schoolId },
    include: { classGroups: { select: { id: true } } },
  });
  if (!teacher) return { error: 'Enseignant introuvable.' };

  // Email uniqueness (excluding current user)
  const emailOwner = await prisma.user.findFirst({
    where: {
      schoolId,
      email: d.email.toLowerCase(),
      NOT: { id: teacher.userId },
    },
  });
  if (emailOwner) {
    return { error: 'Cet email est déjà utilisé par un autre utilisateur.' };
  }

  // Guard: cannot deactivate teacher who still has classes
  if (!d.isActive && teacher.isActive && teacher.classGroups.length > 0) {
    return {
      error: `Cet enseignant est assigné à ${teacher.classGroups.length} classe(s). Réassignez-les avant de le désactiver.`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: teacher.userId },
      data: {
        email: d.email.toLowerCase(),
        firstName: d.firstName,
        lastName: d.lastName,
        isActive: d.isActive,
      },
    });
    await tx.teacher.update({
      where: { id },
      data: {
        gender: d.gender,
        phone: d.phone || null,
        address: d.address || null,
        dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : null,
        specialization: d.specialization || null,
        isActive: d.isActive,
      },
    });
  });

  revalidatePath('/admin/vie-scolaire/enseignants');
  revalidatePath(`/admin/vie-scolaire/enseignants/${id}`);
  return { success: true };
}

export async function deleteTeacher(id: string) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const teacher = await prisma.teacher.findFirst({
    where: { id, schoolId },
    include: { classGroups: { select: { id: true, label: true } } },
  });
  if (!teacher) return { error: 'Enseignant introuvable.' };

  if (teacher.classGroups.length > 0) {
    return {
      error: `Cet enseignant est assigné à ${teacher.classGroups.length} classe(s). Réassignez les classes à un autre enseignant d'abord.`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.teacherSubject.deleteMany({ where: { teacherId: id } });
    await tx.teacher.delete({ where: { id } });
    await tx.user.delete({ where: { id: teacher.userId } });
  });

  revalidatePath('/admin/vie-scolaire/enseignants');
  return { success: true };
}
