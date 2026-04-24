'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { attendanceSaveSchema } from '@/lib/validators/attendance';
import {
  LATE_TO_ABSENT_MINUTES,
  TIME_SLOT_DAY_OF_WEEK,
  TIME_SLOTS,
} from '@/lib/constants';
import type { TimeSlot } from '@prisma/client';

function startOfDayUTC(d: Date) {
  const nd = new Date(d);
  nd.setUTCHours(0, 0, 0, 0);
  return nd;
}

function mondayOfWeek(from: Date) {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function slotDateInWeek(monday: Date, slot: TimeSlot) {
  const targetDow = TIME_SLOT_DAY_OF_WEEK[slot];
  const d = new Date(monday);
  const mondayDow = 1;
  let add = targetDow - mondayDow;
  if (add < 0) add += 7;
  d.setDate(d.getDate() + add);
  return d;
}

export async function getClassesForAttendance() {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

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
      _count: { select: { students: true } },
    },
    orderBy: { label: 'asc' },
  });

  return classes.map((c) => {
    const schedule = c.schedules[0] ?? null;
    return {
      id: c.id,
      label: c.label,
      levelLabel: c.level.label,
      classGender: c.classGender,
      teacherId: c.mainTeacherId,
      teacherName: c.mainTeacher
        ? `${c.mainTeacher.user.firstName} ${c.mainTeacher.user.lastName}`
        : null,
      timeSlot: schedule?.timeSlot ?? null,
      startTime: schedule?.startTime ?? null,
      endTime: schedule?.endTime ?? null,
      studentCount: c._count.students,
    };
  });
}

export type AttendanceClassOption = Awaited<
  ReturnType<typeof getClassesForAttendance>
>[number];

export async function getClassForAttendance(classGroupId: string) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: classGroupId, schoolId },
    include: {
      level: { select: { label: true } },
      mainTeacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      schedules: {
        select: {
          id: true,
          timeSlot: true,
          startTime: true,
          endTime: true,
          room: true,
        },
        take: 1,
      },
      students: {
        where: { status: 'INSCRIT' },
        select: { id: true, firstName: true, lastName: true, matricule: true },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      },
    },
  });

  if (!classGroup) return null;
  const schedule = classGroup.schedules[0] ?? null;

  return {
    id: classGroup.id,
    label: classGroup.label,
    levelLabel: classGroup.level.label,
    classGender: classGroup.classGender,
    teacherName: classGroup.mainTeacher
      ? `${classGroup.mainTeacher.user.firstName} ${classGroup.mainTeacher.user.lastName}`
      : null,
    schedule,
    students: classGroup.students,
  };
}

export type ClassForAttendance = NonNullable<
  Awaited<ReturnType<typeof getClassForAttendance>>
>;

export async function getAttendanceByClassAndDate(
  classGroupId: string,
  scheduleId: string,
  dateISO: string,
) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;
  const date = startOfDayUTC(new Date(dateISO));
  const records = await prisma.attendance.findMany({
    where: {
      schoolId,
      scheduleId,
      date,
      student: { classGroupId },
    },
    select: {
      id: true,
      studentId: true,
      status: true,
      reason: true,
    },
  });
  return records;
}

export async function saveAttendance(data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;
  const userId = session.user.id;

  const parsed = attendanceSaveSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const schedule = await prisma.schedule.findFirst({
    where: {
      id: parsed.data.scheduleId,
      schoolId,
      classGroupId: parsed.data.classGroupId,
    },
  });
  if (!schedule) return { error: 'Créneau introuvable.' };

  const studentIds = parsed.data.entries.map((e) => e.studentId);
  const students = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
      schoolId,
      classGroupId: parsed.data.classGroupId,
    },
    select: { id: true },
  });
  if (students.length !== studentIds.length) {
    return { error: 'Certains élèves sont introuvables ou hors classe.' };
  }

  const date = startOfDayUTC(parsed.data.date);

  await prisma.$transaction(async (tx) => {
    for (const entry of parsed.data.entries) {
      let status = entry.status;
      let reason = entry.reason?.trim() || null;
      if (status === 'RETARD') {
        const minutes = entry.lateMinutes ?? 0;
        if (minutes > LATE_TO_ABSENT_MINUTES) {
          status = 'ABSENT';
          reason = reason
            ? `${reason} (retard > ${LATE_TO_ABSENT_MINUTES} min)`
            : `Retard de ${minutes} min converti en absence`;
        } else {
          reason = reason || `Retard de ${minutes} min`;
        }
      }

      await tx.attendance.upsert({
        where: {
          scheduleId_studentId_date: {
            scheduleId: parsed.data.scheduleId,
            studentId: entry.studentId,
            date,
          },
        },
        create: {
          schoolId,
          scheduleId: parsed.data.scheduleId,
          studentId: entry.studentId,
          date,
          status,
          reason,
          halfDay: schedule.timeSlot,
          recordedById: userId,
        },
        update: {
          status,
          reason,
          recordedById: userId,
        },
      });
    }
  });

  revalidatePath('/admin/vie-scolaire');
  revalidatePath('/admin/vie-scolaire/appel');
  revalidatePath(`/admin/vie-scolaire/eleves`);
  return { success: true };
}

export interface AttendanceHistoryFilters {
  classGroupId?: string;
  dateFrom?: string;
  dateTo?: string;
  statusFilter?: 'ALL' | 'WITH_ABSENCES' | 'FULL_PRESENT';
  studentQuery?: string;
}

export async function getAttendanceHistory(
  filters: AttendanceHistoryFilters = {},
) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const where: {
    schoolId: string;
    date?: { gte?: Date; lte?: Date };
    student?: { classGroupId?: string };
  } = { schoolId };
  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = startOfDayUTC(new Date(filters.dateFrom));
    if (filters.dateTo) where.date.lte = startOfDayUTC(new Date(filters.dateTo));
  }
  if (filters.classGroupId) {
    where.student = { classGroupId: filters.classGroupId };
  }

  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          classGroupId: true,
          classGroup: {
            select: {
              id: true,
              label: true,
              mainTeacher: {
                include: { user: { select: { firstName: true, lastName: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  const q = filters.studentQuery?.trim().toLowerCase() ?? '';

  type Group = {
    key: string;
    date: string;
    classGroupId: string;
    classLabel: string;
    teacherName: string | null;
    scheduleId: string;
    timeSlot: TimeSlot;
    present: number;
    absent: number;
    retard: number;
    total: number;
    studentMatches: boolean;
  };

  const groups = new Map<string, Group>();

  for (const a of attendances) {
    const key = `${a.student.classGroupId}|${a.date.toISOString()}|${a.scheduleId}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        date: a.date.toISOString(),
        classGroupId: a.student.classGroupId,
        classLabel: a.student.classGroup.label,
        teacherName: a.student.classGroup.mainTeacher
          ? `${a.student.classGroup.mainTeacher.user.firstName} ${a.student.classGroup.mainTeacher.user.lastName}`
          : null,
        scheduleId: a.scheduleId,
        timeSlot: a.halfDay,
        present: 0,
        absent: 0,
        retard: 0,
        total: 0,
        studentMatches: q ? false : true,
      };
      groups.set(key, g);
    }
    g.total++;
    if (a.status === 'PRESENT') g.present++;
    else if (a.status === 'ABSENT') g.absent++;
    else if (a.status === 'RETARD') g.retard++;
    if (q) {
      const name = `${a.student.firstName} ${a.student.lastName}`.toLowerCase();
      if (name.includes(q)) g.studentMatches = true;
    }
  }

  let result = Array.from(groups.values()).filter((g) => g.studentMatches);

  if (filters.statusFilter === 'WITH_ABSENCES') {
    result = result.filter((g) => g.absent > 0);
  } else if (filters.statusFilter === 'FULL_PRESENT') {
    result = result.filter((g) => g.total > 0 && g.present === g.total);
  }

  return result.map((g) => ({
    key: g.key,
    date: g.date,
    classGroupId: g.classGroupId,
    classLabel: g.classLabel,
    teacherName: g.teacherName,
    scheduleId: g.scheduleId,
    timeSlot: g.timeSlot,
    present: g.present,
    absent: g.absent,
    retard: g.retard,
    total: g.total,
    presenceRate: g.total > 0 ? Math.round((g.present / g.total) * 100) : 0,
  }));
}

export type AttendanceHistoryRow = Awaited<
  ReturnType<typeof getAttendanceHistory>
>[number];

export async function getAttendanceDetail(
  classGroupId: string,
  dateISO: string,
) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;
  const date = startOfDayUTC(new Date(dateISO));

  const classGroup = await prisma.classGroup.findFirst({
    where: { id: classGroupId, schoolId },
    include: {
      level: { select: { label: true } },
      mainTeacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  });
  if (!classGroup) return null;

  const records = await prisma.attendance.findMany({
    where: {
      schoolId,
      date,
      student: { classGroupId },
    },
    include: {
      student: {
        select: { id: true, firstName: true, lastName: true, matricule: true },
      },
    },
    orderBy: [{ student: { lastName: 'asc' } }, { student: { firstName: 'asc' } }],
  });

  return {
    classLabel: classGroup.label,
    levelLabel: classGroup.level.label,
    teacherName: classGroup.mainTeacher
      ? `${classGroup.mainTeacher.user.firstName} ${classGroup.mainTeacher.user.lastName}`
      : null,
    date: date.toISOString(),
    timeSlot: records[0]?.halfDay ?? null,
    entries: records.map((r) => ({
      id: r.id,
      studentId: r.student.id,
      firstName: r.student.firstName,
      lastName: r.student.lastName,
      matricule: r.student.matricule,
      status: r.status,
      reason: r.reason,
    })),
  };
}

export type AttendanceDetail = NonNullable<
  Awaited<ReturnType<typeof getAttendanceDetail>>
>;

export async function getWeeklyAttendanceStatus() {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const academicYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
  });
  if (!academicYear) return [];

  const schedules = await prisma.schedule.findMany({
    where: { schoolId, academicYearId: academicYear.id },
    include: {
      classGroup: {
        select: {
          id: true,
          label: true,
          classGender: true,
          _count: { select: { students: true } },
        },
      },
    },
  });

  const slotMap = new Map<TimeSlot, (typeof schedules)[number]>();
  for (const s of schedules) {
    if (!slotMap.has(s.timeSlot)) slotMap.set(s.timeSlot, s);
  }

  const now = new Date();
  const monday = mondayOfWeek(now);
  now.setHours(0, 0, 0, 0);

  const result = [];
  for (const slot of TIME_SLOTS) {
    const sched = slotMap.get(slot);
    const slotDate = slotDateInWeek(monday, slot);
    const slotDateISO = slotDate.toISOString();
    const isPast = slotDate.getTime() < now.getTime();
    const isToday = slotDate.getTime() === now.getTime();

    let done = false;
    if (sched) {
      const count = await prisma.attendance.count({
        where: {
          schoolId,
          scheduleId: sched.id,
          date: startOfDayUTC(slotDate),
        },
      });
      done = count > 0;
    }

    result.push({
      timeSlot: slot,
      date: slotDateISO,
      isPast,
      isToday,
      classGroupId: sched?.classGroupId ?? null,
      classLabel: sched?.classGroup.label ?? null,
      classGender: sched?.classGroup.classGender ?? null,
      studentCount: sched?.classGroup._count.students ?? 0,
      startTime: sched?.startTime ?? null,
      endTime: sched?.endTime ?? null,
      done,
      state: !sched
        ? ('FREE' as const)
        : done
          ? ('DONE' as const)
          : isPast || isToday
            ? ('PENDING' as const)
            : ('UPCOMING' as const),
    });
  }

  return result;
}

export type WeeklyAttendanceStatusRow = Awaited<
  ReturnType<typeof getWeeklyAttendanceStatus>
>[number];

export async function getAttendanceStats(
  classGroupId?: string,
  dateFrom?: string,
  dateTo?: string,
) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const academicYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
  });

  const where: {
    schoolId: string;
    date?: { gte?: Date; lte?: Date };
    student?: { classGroupId?: string };
  } = { schoolId };
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = startOfDayUTC(new Date(dateFrom));
    if (dateTo) where.date.lte = startOfDayUTC(new Date(dateTo));
  }
  if (classGroupId) {
    where.student = { classGroupId };
  }

  const attendances = await prisma.attendance.findMany({
    where,
    select: {
      status: true,
      studentId: true,
      scheduleId: true,
      date: true,
      student: {
        select: {
          firstName: true,
          lastName: true,
          classGroupId: true,
          classGroup: { select: { label: true } },
        },
      },
    },
  });

  let present = 0,
    absent = 0,
    retard = 0;
  const perStudent = new Map<
    string,
    {
      studentId: string;
      firstName: string;
      lastName: string;
      classLabel: string;
      total: number;
      absent: number;
      retard: number;
      present: number;
    }
  >();
  const perClass = new Map<
    string,
    {
      classGroupId: string;
      classLabel: string;
      total: number;
      absent: number;
      retard: number;
      present: number;
      sessions: Set<string>;
    }
  >();

  for (const a of attendances) {
    if (a.status === 'PRESENT') present++;
    else if (a.status === 'ABSENT') absent++;
    else if (a.status === 'RETARD') retard++;

    let p = perStudent.get(a.studentId);
    if (!p) {
      p = {
        studentId: a.studentId,
        firstName: a.student.firstName,
        lastName: a.student.lastName,
        classLabel: a.student.classGroup.label,
        total: 0,
        absent: 0,
        retard: 0,
        present: 0,
      };
      perStudent.set(a.studentId, p);
    }
    p.total++;
    if (a.status === 'PRESENT') p.present++;
    else if (a.status === 'ABSENT') p.absent++;
    else if (a.status === 'RETARD') p.retard++;

    let c = perClass.get(a.student.classGroupId);
    if (!c) {
      c = {
        classGroupId: a.student.classGroupId,
        classLabel: a.student.classGroup.label,
        total: 0,
        absent: 0,
        retard: 0,
        present: 0,
        sessions: new Set<string>(),
      };
      perClass.set(a.student.classGroupId, c);
    }
    c.total++;
    if (a.status === 'PRESENT') c.present++;
    else if (a.status === 'ABSENT') c.absent++;
    else if (a.status === 'RETARD') c.retard++;
    c.sessions.add(`${a.scheduleId}|${a.date.toISOString()}`);
  }

  const total = present + absent + retard;
  const presenceRate = total > 0 ? Math.round((present / total) * 100) : 0;

  const topAbsences = Array.from(perStudent.values())
    .filter((p) => p.absent > 0)
    .sort((a, b) => b.absent - a.absent || b.retard - a.retard)
    .slice(0, 5)
    .map((p) => ({
      studentId: p.studentId,
      firstName: p.firstName,
      lastName: p.lastName,
      classLabel: p.classLabel,
      absent: p.absent,
      retard: p.retard,
      presenceRate: p.total > 0 ? Math.round((p.present / p.total) * 100) : 0,
    }));

  // Expected sessions = count of distinct (scheduleId, date) across all attendances OR
  // we could compute from schedules × past course days — simpler: count actual sessions we have any attendance for.
  const sessionsDone = new Set<string>();
  for (const a of attendances) sessionsDone.add(`${a.scheduleId}|${a.date.toISOString()}`);

  const perClassArr = Array.from(perClass.values())
    .map((c) => ({
      classGroupId: c.classGroupId,
      classLabel: c.classLabel,
      sessions: c.sessions.size,
      absent: c.absent,
      retard: c.retard,
      present: c.present,
      presenceRate: c.total > 0 ? Math.round((c.present / c.total) * 100) : 0,
    }))
    .sort((a, b) => a.classLabel.localeCompare(b.classLabel));

  // Expected sessions: count schedules × number of past course days in range
  // For a simple estimate: count distinct schedule IDs × number of sessions completed on average
  const scheduleCount = academicYear
    ? await prisma.schedule.count({
        where: { schoolId, academicYearId: academicYear.id },
      })
    : 0;

  return {
    totals: {
      sessions: sessionsDone.size,
      expectedSessions: scheduleCount,
      present,
      absent,
      retard,
      presenceRate,
    },
    topAbsences,
    perClass: perClassArr,
  };
}

export type AttendanceStats = Awaited<ReturnType<typeof getAttendanceStats>>;

export async function getAttendanceExport(filters: AttendanceHistoryFilters = {}) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const where: {
    schoolId: string;
    date?: { gte?: Date; lte?: Date };
    student?: { classGroupId?: string };
  } = { schoolId };
  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = startOfDayUTC(new Date(filters.dateFrom));
    if (filters.dateTo) where.date.lte = startOfDayUTC(new Date(filters.dateTo));
  }
  if (filters.classGroupId) {
    where.student = { classGroupId: filters.classGroupId };
  }

  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
          matricule: true,
          classGroup: { select: { label: true } },
        },
      },
    },
    orderBy: [{ date: 'desc' }, { student: { lastName: 'asc' } }],
  });

  const q = filters.studentQuery?.trim().toLowerCase() ?? '';

  return attendances
    .filter((a) => {
      if (!q) return true;
      return `${a.student.firstName} ${a.student.lastName}`
        .toLowerCase()
        .includes(q);
    })
    .map((a) => ({
      date: a.date.toISOString(),
      classLabel: a.student.classGroup.label,
      matricule: a.student.matricule,
      firstName: a.student.firstName,
      lastName: a.student.lastName,
      timeSlot: a.halfDay,
      status: a.status,
      reason: a.reason ?? '',
    }));
}
