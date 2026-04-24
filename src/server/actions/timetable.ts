'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { TIME_SLOT_DAY_OF_WEEK } from '@/lib/constants';
import type { TimeSlot } from '@prisma/client';

export interface TimetableClassCell {
  scheduleId: string;
  classGroupId: string;
  classLabel: string;
  levelLabel: string;
  classGender: 'FILLE' | 'GARCON' | 'MIXTE';
  teacherId: string | null;
  teacherName: string | null;
  room: string | null;
  startTime: string;
  endTime: string;
  studentCount: number;
  /** ISO date for this slot in the selected week. */
  slotDate: string;
  /** null = no appel recorded, 'DONE' = all students recorded, 'PARTIAL' = some */
  attendanceStatus: 'DONE' | 'PARTIAL' | 'NONE';
  recordedCount: number;
  /** classification vs now: 'PAST' | 'TODAY' | 'FUTURE' */
  timing: 'PAST' | 'TODAY' | 'FUTURE';
  /** latest course content title for this class (most recent, any date) */
  lastCourseContent: {
    title: string;
    date: string;
  } | null;
  /** latest homework title for this class */
  lastHomework: {
    title: string;
    dueDate: string;
  } | null;
}

export interface TimetableData {
  weekStart: string;
  weekEnd: string;
  /** Multiple classes can share the same timeSlot (different teachers + rooms). */
  cells: Partial<Record<TimeSlot, TimetableClassCell[]>>;
  /** For the "Par enseignant" view */
  teachers: { id: string; name: string; classCount: number; studentCount: number }[];
  /** For the "Par classe" view */
  classes: { id: string; label: string; timeSlot: TimeSlot | null }[];
  kpis: {
    /** Number of TimeSlots that contain at least one class */
    occupied: number;
    totalSlots: number;
    /** Total number of classes planned across all slots this week */
    plannedClasses: number;
    plannedStudents: number;
    activeTeachers: number;
    freeSlots: number;
  };
}

function mondayOfWeek(from: Date) {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  // day: 0 Sun ... 6 Sat. We treat Monday as start of week.
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function slotDateInWeek(monday: Date, slot: TimeSlot): Date {
  const targetDow = TIME_SLOT_DAY_OF_WEEK[slot];
  const d = new Date(monday);
  // monday's getDay() is 1
  let add = targetDow - 1;
  if (add < 0) add += 7;
  d.setDate(d.getDate() + add);
  return d;
}

function classifyTiming(slotDate: Date, now: Date): 'PAST' | 'TODAY' | 'FUTURE' {
  const sd = new Date(slotDate);
  sd.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (sd.getTime() < today.getTime()) return 'PAST';
  if (sd.getTime() === today.getTime()) return 'TODAY';
  return 'FUTURE';
}

export async function getTimetableData(
  weekStartISO?: string,
): Promise<TimetableData> {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const now = new Date();
  const monday = weekStartISO ? mondayOfWeek(new Date(weekStartISO)) : mondayOfWeek(now);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const academicYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
  });

  const schedules = academicYear
    ? await prisma.schedule.findMany({
        where: { schoolId, academicYearId: academicYear.id },
        include: {
          classGroup: {
            include: {
              level: { select: { label: true } },
              mainTeacher: {
                include: { user: { select: { firstName: true, lastName: true } } },
              },
              _count: { select: { students: true } },
              courseContents: {
                orderBy: { date: 'desc' },
                take: 1,
                select: { title: true, content: true, date: true },
              },
              homeworks: {
                orderBy: { dueDate: 'desc' },
                take: 1,
                select: { title: true, description: true, dueDate: true },
              },
            },
          },
        },
      })
    : [];

  // Fetch attendance within this week so we can compute per-slot status
  const attendances = academicYear
    ? await prisma.attendance.findMany({
        where: {
          schoolId,
          date: { gte: monday, lte: sunday },
        },
        select: { scheduleId: true, studentId: true },
      })
    : [];

  const cells: Partial<Record<TimeSlot, TimetableClassCell[]>> = {};
  let plannedStudents = 0;
  let plannedClasses = 0;
  const teacherIds = new Set<string>();

  for (const s of schedules) {
    const slotDate = slotDateInWeek(monday, s.timeSlot);
    const recordedStudents = new Set(
      attendances.filter((a) => a.scheduleId === s.id).map((a) => a.studentId),
    );
    const total = s.classGroup._count.students;
    const recorded = recordedStudents.size;
    const status: TimetableClassCell['attendanceStatus'] =
      total === 0
        ? 'NONE'
        : recorded === 0
          ? 'NONE'
          : recorded >= total
            ? 'DONE'
            : 'PARTIAL';

    const lastCourse = s.classGroup.courseContents[0] ?? null;
    const lastHw = s.classGroup.homeworks[0] ?? null;

    plannedStudents += total;
    plannedClasses += 1;
    if (s.classGroup.mainTeacher) teacherIds.add(s.classGroup.mainTeacher.id);

    const entry: TimetableClassCell = {
      scheduleId: s.id,
      classGroupId: s.classGroupId,
      classLabel: s.classGroup.label,
      levelLabel: s.classGroup.level.label,
      classGender: s.classGroup.classGender,
      teacherId: s.classGroup.mainTeacher?.id ?? null,
      teacherName: s.classGroup.mainTeacher
        ? `${s.classGroup.mainTeacher.user.firstName} ${s.classGroup.mainTeacher.user.lastName}`
        : null,
      room: s.room ?? s.classGroup.room ?? null,
      startTime: s.startTime,
      endTime: s.endTime,
      studentCount: total,
      slotDate: slotDate.toISOString(),
      attendanceStatus: status,
      recordedCount: recorded,
      timing: classifyTiming(slotDate, now),
      lastCourseContent: lastCourse
        ? {
            title: lastCourse.title || lastCourse.content.slice(0, 80),
            date: lastCourse.date.toISOString(),
          }
        : null,
      lastHomework: lastHw
        ? {
            title: lastHw.title || lastHw.description.slice(0, 80),
            dueDate: lastHw.dueDate.toISOString(),
          }
        : null,
    };

    const existing = cells[s.timeSlot];
    if (existing) {
      existing.push(entry);
    } else {
      cells[s.timeSlot] = [entry];
    }
  }

  // Stable ordering within a slot: by class label
  for (const slot of Object.keys(cells) as TimeSlot[]) {
    cells[slot]?.sort((a, b) => a.classLabel.localeCompare(b.classLabel, 'fr'));
  }

  // Build teacher options + per-teacher aggregates (across the whole week set, not just filtered)
  const teachersAll = await prisma.teacher.findMany({
    where: { schoolId, isActive: true },
    include: {
      user: { select: { firstName: true, lastName: true } },
      classGroups: {
        select: { id: true, _count: { select: { students: true } } },
      },
    },
    orderBy: { user: { lastName: 'asc' } },
  });
  const teachersList = teachersAll.map((t) => ({
    id: t.id,
    name: `${t.user.firstName} ${t.user.lastName}`,
    classCount: t.classGroups.length,
    studentCount: t.classGroups.reduce((a, c) => a + c._count.students, 0),
  }));

  // Classes list (all classes for the current academic year)
  const classesList = academicYear
    ? (
        await prisma.classGroup.findMany({
          where: { schoolId, academicYearId: academicYear.id },
          include: { schedules: { select: { timeSlot: true }, take: 1 } },
          orderBy: { label: 'asc' },
        })
      ).map((c) => ({
        id: c.id,
        label: c.label,
        timeSlot: (c.schedules[0]?.timeSlot as TimeSlot | undefined) ?? null,
      }))
    : [];

  const occupied = (Object.keys(cells) as TimeSlot[]).filter(
    (k) => (cells[k]?.length ?? 0) > 0,
  ).length;
  const TOTAL_SLOTS = 5; // 5 demi-journées autorisées
  return {
    weekStart: monday.toISOString(),
    weekEnd: sunday.toISOString(),
    cells,
    teachers: teachersList,
    classes: classesList,
    kpis: {
      occupied,
      totalSlots: TOTAL_SLOTS,
      plannedClasses,
      plannedStudents,
      activeTeachers: teacherIds.size,
      freeSlots: TOTAL_SLOTS - occupied,
    },
  };
}
