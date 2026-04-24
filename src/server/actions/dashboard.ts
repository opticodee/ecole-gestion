'use server';

import { prisma } from '@/lib/prisma';
import { TIME_SLOTS, ABSENCE_ALERT_THRESHOLD } from '@/lib/constants';
import type { TimeSlot } from '@prisma/client';

const DAY_TO_TIME_SLOTS: Record<number, TimeSlot[]> = {
  0: ['DIMANCHE_AM', 'DIMANCHE_PM'],
  3: ['MERCREDI_PM'],
  6: ['SAMEDI_AM', 'SAMEDI_PM'],
};

function nextCourseDate(from: Date): { date: Date; slots: TimeSlot[] } {
  const base = new Date(from);
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < 8; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const slots = DAY_TO_TIME_SLOTS[d.getDay()];
    if (slots) return { date: d, slots };
  }
  return { date: base, slots: [] };
}

export async function getDashboardData(schoolId: string) {
  const academicYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    studentsAgg,
    classesAgg,
    teachersCount,
    subjectsCount,
    absencesCount,
    retardsCount,
    schedules,
    absenceAlerts,
    recentCourses,
    recentHomeworks,
  ] = await Promise.all([
    prisma.student.groupBy({
      by: ['gender'],
      where: { schoolId, status: 'INSCRIT' },
      _count: { _all: true },
    }),
    academicYear
      ? prisma.classGroup.groupBy({
          by: ['classGender'],
          where: { schoolId, academicYearId: academicYear.id },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    prisma.teacher.count({ where: { schoolId, isActive: true } }),
    prisma.subject.count({ where: { schoolId } }),
    prisma.attendance.count({
      where: {
        schoolId,
        status: 'ABSENT',
        date: { gte: monthStart, lt: monthEnd },
      },
    }),
    prisma.attendance.count({
      where: {
        schoolId,
        status: 'RETARD',
        date: { gte: monthStart, lt: monthEnd },
      },
    }),
    academicYear
      ? prisma.schedule.findMany({
          where: { schoolId, academicYearId: academicYear.id },
          include: {
            classGroup: {
              include: {
                level: { select: { label: true } },
                mainTeacher: {
                  include: {
                    user: { select: { firstName: true, lastName: true } },
                  },
                },
                _count: { select: { students: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
    prisma.attendance.groupBy({
      by: ['studentId'],
      where: {
        schoolId,
        status: 'ABSENT',
        date: { gte: monthStart, lt: monthEnd },
      },
      _count: { _all: true },
      having: { studentId: { _count: { gte: ABSENCE_ALERT_THRESHOLD } } },
    }),
    prisma.courseContent.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        classGroup: { select: { label: true } },
      },
    }),
    prisma.homework.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        classGroup: { select: { label: true } },
      },
    }),
  ]);

  // KPIs students
  const boys = studentsAgg.find((g) => g.gender === 'MALE')?._count._all ?? 0;
  const girls = studentsAgg.find((g) => g.gender === 'FEMALE')?._count._all ?? 0;

  // KPIs classes
  const classesGarcon =
    classesAgg.find((g) => g.classGender === 'GARCON')?._count._all ?? 0;
  const classesFille =
    classesAgg.find((g) => g.classGender === 'FILLE')?._count._all ?? 0;
  const classesMixte =
    classesAgg.find((g) => g.classGender === 'MIXTE')?._count._all ?? 0;

  // Planning by slot
  const slotMap = new Map<
    TimeSlot,
    {
      scheduleId: string;
      classGroupId: string;
      classLabel: string;
      levelLabel: string;
      classGender: string;
      teacherName: string | null;
      room: string | null;
      startTime: string;
      endTime: string;
      studentCount: number;
    }
  >();
  for (const s of schedules) {
    if (slotMap.has(s.timeSlot)) continue;
    slotMap.set(s.timeSlot, {
      scheduleId: s.id,
      classGroupId: s.classGroupId,
      classLabel: s.classGroup.label,
      levelLabel: s.classGroup.level.label,
      classGender: s.classGroup.classGender,
      teacherName: s.classGroup.mainTeacher
        ? `${s.classGroup.mainTeacher.user.firstName} ${s.classGroup.mainTeacher.user.lastName}`
        : null,
      room: s.room ?? s.classGroup.room ?? null,
      startTime: s.startTime,
      endTime: s.endTime,
      studentCount: s.classGroup._count.students,
    });
  }

  const weeklyPlanning = TIME_SLOTS.map((slot) => ({
    timeSlot: slot,
    entry: slotMap.get(slot) ?? null,
  }));

  // Upcoming courses: today or next course day
  const { date: nextDate, slots: nextSlots } = nextCourseDate(now);
  const nextDateISO = nextDate.toISOString();
  const isToday =
    nextDate.getFullYear() === now.getFullYear() &&
    nextDate.getMonth() === now.getMonth() &&
    nextDate.getDate() === now.getDate();

  const upcoming = nextSlots
    .map((slot) => slotMap.get(slot))
    .filter(
      (v): v is NonNullable<typeof v> => !!v,
    )
    .slice(0, 5)
    .map((entry, idx) => ({
      timeSlot: nextSlots[idx],
      entry,
    }));

  // Absence alerts (need student details)
  const alertStudentIds = absenceAlerts.map((a) => a.studentId);
  const alertStudents = alertStudentIds.length
    ? await prisma.student.findMany({
        where: { id: { in: alertStudentIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          classGroup: { select: { label: true } },
        },
      })
    : [];
  const alerts = absenceAlerts
    .map((a) => {
      const st = alertStudents.find((s) => s.id === a.studentId);
      if (!st) return null;
      return {
        studentId: st.id,
        firstName: st.firstName,
        lastName: st.lastName,
        classLabel: st.classGroup.label,
        count: a._count._all,
      };
    })
    .filter((v): v is NonNullable<typeof v> => !!v)
    .sort((a, b) => b.count - a.count);

  // Recent activity
  const recent = [
    ...recentCourses.map((c) => ({
      kind: 'COURSE' as const,
      id: c.id,
      title: c.title || 'Contenu de cours',
      classLabel: c.classGroup.label,
      createdAt: c.createdAt.toISOString(),
      href: '/admin/vie-scolaire/contenu-cours',
    })),
    ...recentHomeworks.map((h) => ({
      kind: 'HOMEWORK' as const,
      id: h.id,
      title: h.title || 'Devoir',
      classLabel: h.classGroup.label,
      createdAt: h.createdAt.toISOString(),
      href: '/admin/vie-scolaire/devoirs',
    })),
  ]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5);

  return {
    kpis: {
      studentsTotal: boys + girls,
      boys,
      girls,
      classesTotal: classesGarcon + classesFille + classesMixte,
      classesGarcon,
      classesFille,
      classesMixte,
      teachers: teachersCount,
      subjects: subjectsCount,
      monthAbsences: absencesCount,
      monthRetards: retardsCount,
    },
    weeklyPlanning,
    upcoming: {
      date: nextDateISO,
      isToday,
      items: upcoming,
    },
    alerts,
    recent,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
