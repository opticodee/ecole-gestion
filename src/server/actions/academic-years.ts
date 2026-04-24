'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { academicYearSchema } from '@/lib/validators/academic-year';

/**
 * Returns the currently ACTIVE academic year for the given school, or null.
 * This is the source of truth — all Server Actions that write or read
 * "current year" data should go through this helper.
 */
export async function getActiveAcademicYear(schoolId: string) {
  return prisma.academicYear.findFirst({
    where: { schoolId, status: 'ACTIVE' },
  });
}

/**
 * Guard: returns { ok: false } if the academic year is CLOTUREE.
 */
export async function assertYearNotClosed(
  academicYearId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const year = await prisma.academicYear.findUnique({
    where: { id: academicYearId },
    select: { status: true, label: true },
  });
  if (!year) return { ok: false, error: 'Année scolaire introuvable.' };
  if (year.status === 'CLOTUREE') {
    return {
      ok: false,
      error: `L'année ${year.label} est clôturée — modification impossible.`,
    };
  }
  return { ok: true };
}

export async function getAcademicYears() {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const years = await prisma.academicYear.findMany({
    where: { schoolId },
    orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
    include: {
      _count: {
        select: {
          classGroups: true,
          appreciations: true,
        },
      },
      classGroups: {
        select: {
          _count: { select: { students: true } },
          evaluations: { select: { id: true } },
        },
      },
    },
  });

  // Sort: ACTIVE first, then BROUILLON, then CLOTUREE
  const statusRank = { ACTIVE: 0, BROUILLON: 1, CLOTUREE: 2 } as const;
  const sorted = [...years].sort(
    (a, b) =>
      statusRank[a.status] - statusRank[b.status] ||
      b.startDate.getTime() - a.startDate.getTime(),
  );

  return sorted.map((y) => {
    const studentCount = y.classGroups.reduce(
      (acc, c) => acc + c._count.students,
      0,
    );
    const evaluationCount = y.classGroups.reduce(
      (acc, c) => acc + c.evaluations.length,
      0,
    );
    return {
      id: y.id,
      label: y.label,
      status: y.status,
      startDate: y.startDate.toISOString(),
      endDate: y.endDate.toISOString(),
      trimestre1Start: y.trimestre1Start?.toISOString() ?? null,
      trimestre1End: y.trimestre1End?.toISOString() ?? null,
      trimestre2Start: y.trimestre2Start?.toISOString() ?? null,
      trimestre2End: y.trimestre2End?.toISOString() ?? null,
      trimestre3Start: y.trimestre3Start?.toISOString() ?? null,
      trimestre3End: y.trimestre3End?.toISOString() ?? null,
      closedAt: y.closedAt?.toISOString() ?? null,
      stats: {
        classCount: y._count.classGroups,
        studentCount,
        evaluationCount,
        appreciationCount: y._count.appreciations,
      },
    };
  });
}

export type AcademicYearRow = Awaited<ReturnType<typeof getAcademicYears>>[number];

export async function createAcademicYear(data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = academicYearSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  // Label uniqueness per school
  const existing = await prisma.academicYear.findFirst({
    where: { schoolId, label: d.label },
  });
  if (existing) return { error: 'Une année avec ce libellé existe déjà.' };

  await prisma.academicYear.create({
    data: {
      schoolId,
      label: d.label,
      startDate: d.startDate,
      endDate: d.endDate,
      trimestre1Start: d.trimestre1Start,
      trimestre1End: d.trimestre1End,
      trimestre2Start: d.trimestre2Start,
      trimestre2End: d.trimestre2End,
      trimestre3Start: d.trimestre3Start,
      trimestre3End: d.trimestre3End,
      status: 'BROUILLON',
      isCurrent: false,
    },
  });

  revalidatePath('/admin/vie-scolaire/annee-scolaire');
  return { success: true };
}

export async function updateAcademicYear(
  id: string,
  data: Record<string, unknown>,
) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = academicYearSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const year = await prisma.academicYear.findFirst({
    where: { id, schoolId },
  });
  if (!year) return { error: 'Année introuvable.' };
  if (year.status === 'CLOTUREE') {
    return { error: 'Impossible de modifier une année clôturée.' };
  }

  const dup = await prisma.academicYear.findFirst({
    where: { schoolId, label: d.label, NOT: { id } },
  });
  if (dup) return { error: 'Une année avec ce libellé existe déjà.' };

  await prisma.academicYear.update({
    where: { id },
    data: {
      label: d.label,
      startDate: d.startDate,
      endDate: d.endDate,
      trimestre1Start: d.trimestre1Start,
      trimestre1End: d.trimestre1End,
      trimestre2Start: d.trimestre2Start,
      trimestre2End: d.trimestre2End,
      trimestre3Start: d.trimestre3Start,
      trimestre3End: d.trimestre3End,
    },
  });

  revalidatePath('/admin/vie-scolaire/annee-scolaire');
  return { success: true };
}

export async function activateAcademicYear(id: string, closePrevious = false) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const year = await prisma.academicYear.findFirst({
    where: { id, schoolId },
  });
  if (!year) return { error: 'Année introuvable.' };
  if (year.status === 'CLOTUREE') {
    return { error: 'Impossible d\'activer une année clôturée.' };
  }
  if (year.status === 'ACTIVE') {
    return { error: 'Cette année est déjà active.' };
  }

  const current = await getActiveAcademicYear(schoolId);
  if (current && !closePrevious) {
    return {
      conflict: {
        activeLabel: current.label,
        activeId: current.id,
      },
    };
  }

  await prisma.$transaction(async (tx) => {
    if (current) {
      await tx.academicYear.update({
        where: { id: current.id },
        data: {
          status: 'CLOTUREE',
          isCurrent: false,
          closedAt: new Date(),
        },
      });
    }
    await tx.academicYear.update({
      where: { id },
      data: { status: 'ACTIVE', isCurrent: true },
    });
  });

  revalidatePath('/admin/vie-scolaire/annee-scolaire');
  revalidatePath('/admin/vie-scolaire');
  return { success: true };
}

export async function closeAcademicYear(id: string) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const year = await prisma.academicYear.findFirst({
    where: { id, schoolId },
  });
  if (!year) return { error: 'Année introuvable.' };
  if (year.status === 'CLOTUREE') {
    return { error: 'Cette année est déjà clôturée.' };
  }
  if (year.status !== 'ACTIVE') {
    return {
      error: 'Seule une année active peut être clôturée (activez-la d\'abord).',
    };
  }

  await prisma.academicYear.update({
    where: { id },
    data: { status: 'CLOTUREE', isCurrent: false, closedAt: new Date() },
  });

  revalidatePath('/admin/vie-scolaire/annee-scolaire');
  return { success: true };
}

/**
 * Returns { pendingTransitions } : number of students in this year whose
 * transitions are still EN_ATTENTE or unapplied — to warn before closing.
 */
export async function getClosureWarnings(id: string) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const year = await prisma.academicYear.findFirst({
    where: { id, schoolId },
    include: {
      _count: {
        select: {
          transitions: true,
          classGroups: true,
        },
      },
    },
  });
  if (!year) return { error: 'Année introuvable.' };

  const [studentsInYear, unappliedTransitions] = await Promise.all([
    prisma.student.count({
      where: { schoolId, classGroup: { academicYearId: id } },
    }),
    prisma.classTransition.count({
      where: { schoolId, academicYearId: id, isApplied: false },
    }),
  ]);

  const pendingPassages =
    year._count.classGroups > 0 && studentsInYear > 0
      ? studentsInYear - (year._count.transitions - unappliedTransitions)
      : 0;

  return {
    studentsInYear,
    unappliedTransitions,
    classGroupCount: year._count.classGroups,
    pendingPassages: Math.max(0, pendingPassages),
  };
}

export async function deleteAcademicYear(id: string) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const year = await prisma.academicYear.findFirst({
    where: { id, schoolId },
    include: {
      _count: {
        select: {
          classGroups: true,
          appreciations: true,
          transitions: true,
        },
      },
    },
  });
  if (!year) return { error: 'Année introuvable.' };
  if (year.status !== 'BROUILLON') {
    return {
      error: 'Seule une année en brouillon peut être supprimée.',
    };
  }

  const hasData =
    year._count.classGroups > 0 ||
    year._count.appreciations > 0 ||
    year._count.transitions > 0;
  if (hasData) {
    return {
      error:
        'Cette année contient des données (classes / appréciations / passages). Supprimez-les d\'abord.',
    };
  }

  await prisma.academicYear.delete({ where: { id } });

  revalidatePath('/admin/vie-scolaire/annee-scolaire');
  return { success: true };
}

export async function listAcademicYearsForHeader() {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;
  const years = await prisma.academicYear.findMany({
    where: { schoolId },
    select: { id: true, label: true, status: true },
    orderBy: { startDate: 'desc' },
  });
  const rank = { ACTIVE: 0, CLOTUREE: 1, BROUILLON: 2 } as const;
  return years.sort((a, b) => rank[a.status] - rank[b.status]);
}
