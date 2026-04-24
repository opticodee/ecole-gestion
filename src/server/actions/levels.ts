'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { levelSchema } from '@/lib/validators/level';

export async function getLevels(schoolId: string) {
  const levels = await prisma.level.findMany({
    where: { schoolId },
    include: {
      classGroups: {
        include: {
          _count: { select: { students: true } },
        },
      },
    },
    orderBy: { order: 'asc' },
  });

  return levels.map((level) => {
    const totalCapacity = level.classGroups.reduce((sum, cg) => sum + cg.capacity, 0);
    const totalStudents = level.classGroups.reduce((sum, cg) => sum + cg._count.students, 0);
    const fillRate = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

    return {
      id: level.id,
      label: level.label,
      code: level.code,
      order: level.order,
      description: level.description,
      totalCapacity,
      totalStudents,
      fillRate,
      classCount: level.classGroups.length,
    };
  });
}

export type LevelRow = Awaited<ReturnType<typeof getLevels>>[number];

export async function createLevel(data: { label: string; capacity: number }) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = levelSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Generate code from label
  const code = parsed.data.label
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 20);

  // Check unique code
  const existing = await prisma.level.findUnique({
    where: { schoolId_code: { schoolId, code } },
  });
  if (existing) {
    return { error: 'Un niveau avec un code similaire existe déjà.' };
  }

  // Determine next order
  const maxOrder = await prisma.level.aggregate({
    where: { schoolId },
    _max: { order: true },
  });

  await prisma.level.create({
    data: {
      schoolId,
      label: parsed.data.label,
      code,
      order: (maxOrder._max.order ?? 0) + 1,
      description: `Capacité : ${parsed.data.capacity} places`,
    },
  });

  revalidatePath('/admin/vie-scolaire/niveaux');
  return { success: true };
}

export async function updateLevel(id: string, data: { label: string; capacity: number }) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = levelSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const level = await prisma.level.findFirst({ where: { id, schoolId } });
  if (!level) return { error: 'Niveau introuvable.' };

  await prisma.level.update({
    where: { id },
    data: {
      label: parsed.data.label,
      description: `Capacité : ${parsed.data.capacity} places`,
    },
  });

  revalidatePath('/admin/vie-scolaire/niveaux');
  return { success: true };
}

export async function deleteLevel(id: string) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const level = await prisma.level.findFirst({
    where: { id, schoolId },
    include: { _count: { select: { classGroups: true } } },
  });

  if (!level) return { error: 'Niveau introuvable.' };

  if (level._count.classGroups > 0) {
    return {
      error: `Ce niveau est utilisé par ${level._count.classGroups} classe(s). Supprimez ou réassignez les classes d'abord.`,
    };
  }

  await prisma.level.delete({ where: { id } });

  revalidatePath('/admin/vie-scolaire/niveaux');
  return { success: true };
}
