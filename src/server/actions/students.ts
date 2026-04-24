'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { studentSchema } from '@/lib/validators/student';

export async function getStudents(schoolId: string) {
  const students = await prisma.student.findMany({
    where: { schoolId },
    include: {
      classGroup: {
        select: {
          id: true,
          label: true,
          classGender: true,
          capacity: true,
          level: { select: { id: true, label: true } },
        },
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  return students.map((s) => ({
    id: s.id,
    matricule: s.matricule,
    gender: s.gender,
    firstName: s.firstName,
    lastName: s.lastName,
    dateOfBirth: s.dateOfBirth.toISOString(),
    placeOfBirth: s.placeOfBirth,
    address: s.address,
    status: s.status,
    classGroupId: s.classGroupId,
    classLabel: s.classGroup.label,
    classGender: s.classGroup.classGender,
    levelId: s.classGroup.level.id,
    levelLabel: s.classGroup.level.label,
  }));
}

export type StudentRow = Awaited<ReturnType<typeof getStudents>>[number];

export async function getClassesForStudentSelect(schoolId: string) {
  const academicYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
  });
  if (!academicYear) return [];

  const classes = await prisma.classGroup.findMany({
    where: { schoolId, academicYearId: academicYear.id },
    include: {
      level: { select: { label: true } },
      _count: { select: { students: true } },
    },
    orderBy: { label: 'asc' },
  });

  return classes.map((c) => ({
    id: c.id,
    label: c.label,
    classGender: c.classGender,
    capacity: c.capacity,
    studentCount: c._count.students,
    levelLabel: c.level.label,
    levelId: c.levelId,
  }));
}

export async function getLevelsForStudentSelect(schoolId: string) {
  return prisma.level.findMany({
    where: { schoolId },
    select: { id: true, label: true },
    orderBy: { order: 'asc' },
  });
}

export async function getStudentById(id: string, schoolId: string) {
  const student = await prisma.student.findFirst({
    where: { id, schoolId },
    include: {
      classGroup: {
        include: {
          level: { select: { id: true, label: true } },
          mainTeacher: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          schedules: {
            select: { timeSlot: true, startTime: true, endTime: true, room: true },
          },
        },
      },
      parents: {
        include: {
          parent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              gender: true,
            },
          },
        },
      },
      attendances: {
        orderBy: { date: 'desc' },
        take: 10,
        include: {
          schedule: { select: { timeSlot: true } },
        },
      },
    },
  });

  if (!student) return null;

  const attendanceCounts = await prisma.attendance.groupBy({
    by: ['status'],
    where: { studentId: id, schoolId },
    _count: true,
  });

  const absenceCount =
    attendanceCounts.find((c) => c.status === 'ABSENT')?._count ?? 0;
  const lateCount =
    attendanceCounts.find((c) => c.status === 'RETARD')?._count ?? 0;

  const schedule = student.classGroup.schedules[0] ?? null;

  return {
    id: student.id,
    matricule: student.matricule,
    gender: student.gender,
    firstName: student.firstName,
    lastName: student.lastName,
    dateOfBirth: student.dateOfBirth.toISOString(),
    placeOfBirth: student.placeOfBirth,
    address: student.address,
    status: student.status,
    photo: student.photo,
    classGroup: {
      id: student.classGroup.id,
      label: student.classGroup.label,
      classGender: student.classGroup.classGender,
      levelId: student.classGroup.level.id,
      levelLabel: student.classGroup.level.label,
      teacherName: student.classGroup.mainTeacher
        ? `${student.classGroup.mainTeacher.user.firstName} ${student.classGroup.mainTeacher.user.lastName}`
        : null,
      schedule: schedule
        ? {
            timeSlot: schedule.timeSlot,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            room: schedule.room,
          }
        : null,
    },
    parents: student.parents.map((sp) => ({
      linkId: sp.id,
      id: sp.parent.id,
      firstName: sp.parent.firstName,
      lastName: sp.parent.lastName,
      email: sp.parent.email,
      phone: sp.parent.phone,
      gender: sp.parent.gender,
      relationship: sp.relationship,
      isPrimaryContact: sp.isPrimaryContact,
    })),
    absenceCount,
    lateCount,
    recentAttendances: student.attendances.map((a) => ({
      id: a.id,
      date: a.date.toISOString(),
      status: a.status,
      timeSlot: a.schedule.timeSlot,
      isJustified: a.isJustified,
      reason: a.reason,
    })),
  };
}

export type StudentDetail = NonNullable<Awaited<ReturnType<typeof getStudentById>>>;

async function generateMatricule(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ACM-${year}-`;
  const latest = await prisma.student.findFirst({
    where: { schoolId, matricule: { startsWith: prefix } },
    orderBy: { matricule: 'desc' },
    select: { matricule: true },
  });
  let next = 1;
  if (latest) {
    const m = latest.matricule.match(/-(\d{4})$/);
    if (m) next = parseInt(m[1], 10) + 1;
  }
  return `${prefix}${String(next).padStart(4, '0')}`;
}

function isGenderCompatible(
  studentGender: 'MALE' | 'FEMALE',
  classGender: 'FILLE' | 'GARCON' | 'MIXTE',
): boolean {
  if (classGender === 'MIXTE') return true;
  if (studentGender === 'MALE') return classGender === 'GARCON';
  return classGender === 'FILLE';
}

export async function createStudent(data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = studentSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const classGroup = await prisma.classGroup.findFirst({
    where: { id: parsed.data.classGroupId, schoolId },
    include: { _count: { select: { students: true } } },
  });
  if (!classGroup) return { error: 'Classe introuvable.' };

  if (!isGenderCompatible(parsed.data.gender, classGroup.classGender)) {
    return {
      error: `Le genre de l'élève n'est pas compatible avec cette classe (${classGroup.classGender}).`,
    };
  }

  if (classGroup._count.students >= classGroup.capacity) {
    return { error: 'Cette classe est complète.' };
  }

  const matricule = await generateMatricule(schoolId);

  await prisma.student.create({
    data: {
      schoolId,
      classGroupId: parsed.data.classGroupId,
      matricule,
      gender: parsed.data.gender,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      dateOfBirth: parsed.data.dateOfBirth,
      placeOfBirth: parsed.data.placeOfBirth || null,
      address: parsed.data.address || null,
      status: parsed.data.status,
      enrollmentDate: new Date(),
    },
  });

  revalidatePath('/admin/vie-scolaire/eleves');
  return { success: true, matricule };
}

export async function updateStudent(id: string, data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = studentSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const student = await prisma.student.findFirst({
    where: { id, schoolId },
  });
  if (!student) return { error: 'Élève introuvable.' };

  const classGroup = await prisma.classGroup.findFirst({
    where: { id: parsed.data.classGroupId, schoolId },
    include: { _count: { select: { students: true } } },
  });
  if (!classGroup) return { error: 'Classe introuvable.' };

  if (!isGenderCompatible(parsed.data.gender, classGroup.classGender)) {
    return {
      error: `Le genre de l'élève n'est pas compatible avec cette classe (${classGroup.classGender}).`,
    };
  }

  if (
    parsed.data.classGroupId !== student.classGroupId &&
    classGroup._count.students >= classGroup.capacity
  ) {
    return { error: 'Cette classe est complète.' };
  }

  await prisma.student.update({
    where: { id },
    data: {
      classGroupId: parsed.data.classGroupId,
      gender: parsed.data.gender,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      dateOfBirth: parsed.data.dateOfBirth,
      placeOfBirth: parsed.data.placeOfBirth || null,
      address: parsed.data.address || null,
      status: parsed.data.status,
    },
  });

  revalidatePath('/admin/vie-scolaire/eleves');
  revalidatePath(`/admin/vie-scolaire/eleves/${id}`);
  return { success: true };
}

export async function deleteStudent(id: string) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const student = await prisma.student.findFirst({
    where: { id, schoolId },
  });
  if (!student) return { error: 'Élève introuvable.' };

  await prisma.$transaction(async (tx) => {
    await tx.attendance.deleteMany({ where: { studentId: id } });
    await tx.studentParent.deleteMany({ where: { studentId: id } });
    await tx.student.delete({ where: { id } });
  });

  revalidatePath('/admin/vie-scolaire/eleves');
  return { success: true };
}
