'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { subjectSchema } from '@/lib/validators/subject';

export async function getSubjects(schoolId: string) {
  const subjects = await prisma.subject.findMany({
    where: { schoolId },
    include: {
      teachers: {
        include: {
          teacher: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
      _count: {
        select: { children: true, courseContents: true, homeworks: true },
      },
    },
    orderBy: [{ parentId: 'asc' }, { label: 'asc' }],
  });

  return subjects.map((s) => ({
    id: s.id,
    parentId: s.parentId,
    label: s.label,
    code: s.code,
    weeklyHours: Number(s.weeklyHours),
    color: s.color,
    description: s.description,
    childrenCount: s._count.children,
    courseContentsCount: s._count.courseContents,
    homeworksCount: s._count.homeworks,
    teachers: s.teachers.map((ts) => ({
      id: ts.teacher.id,
      name: `${ts.teacher.user.firstName} ${ts.teacher.user.lastName}`,
    })),
  }));
}

export type SubjectRow = Awaited<ReturnType<typeof getSubjects>>[number];

export async function getParentSubjects(schoolId: string) {
  const parents = await prisma.subject.findMany({
    where: { schoolId, parentId: null },
    select: { id: true, label: true, code: true },
    orderBy: { label: 'asc' },
  });
  return parents;
}

function slugifyCode(label: string): string {
  return label
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 30);
}

export async function createSubject(data: { label: string; weeklyHours: number; parentId?: string | null }) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = subjectSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const parentId = parsed.data.parentId || null;

  // Un parent ne peut pas être lui-même un enfant : sous-matière de sous-matière interdit
  if (parentId) {
    const parent = await prisma.subject.findFirst({
      where: { id: parentId, schoolId },
    });
    if (!parent) return { error: 'Matière parente introuvable.' };
    if (parent.parentId) {
      return { error: 'Une sous-matière ne peut pas être elle-même une sous-matière.' };
    }
  }

  const code = slugifyCode(parsed.data.label);

  const existing = await prisma.subject.findUnique({
    where: { schoolId_code: { schoolId, code } },
  });
  if (existing) {
    return { error: 'Une matière avec un code similaire existe déjà.' };
  }

  await prisma.subject.create({
    data: {
      schoolId,
      parentId,
      label: parsed.data.label,
      code,
      weeklyHours: parsed.data.weeklyHours,
    },
  });

  revalidatePath('/admin/vie-scolaire/matieres');
  return { success: true };
}

export async function updateSubject(
  id: string,
  data: { label: string; weeklyHours: number; parentId?: string | null },
) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = subjectSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const subject = await prisma.subject.findFirst({
    where: { id, schoolId },
    include: { _count: { select: { children: true } } },
  });
  if (!subject) return { error: 'Matière introuvable.' };

  const newParentId = parsed.data.parentId || null;

  if (newParentId === id) {
    return { error: 'Une matière ne peut pas être son propre parent.' };
  }

  if (newParentId) {
    if (subject._count.children > 0) {
      return { error: 'Cette matière contient des sous-matières : elle ne peut pas devenir elle-même une sous-matière.' };
    }
    const parent = await prisma.subject.findFirst({
      where: { id: newParentId, schoolId },
    });
    if (!parent) return { error: 'Matière parente introuvable.' };
    if (parent.parentId) {
      return { error: 'Une sous-matière ne peut pas être elle-même une sous-matière.' };
    }
  }

  await prisma.subject.update({
    where: { id },
    data: {
      label: parsed.data.label,
      weeklyHours: parsed.data.weeklyHours,
      parentId: newParentId,
    },
  });

  revalidatePath('/admin/vie-scolaire/matieres');
  return { success: true };
}

export async function deleteSubject(id: string) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const subject = await prisma.subject.findFirst({
    where: { id, schoolId },
    include: {
      children: {
        include: {
          _count: {
            select: { courseContents: true, homeworks: true },
          },
        },
      },
      _count: {
        select: { courseContents: true, homeworks: true },
      },
    },
  });

  if (!subject) return { error: 'Matière introuvable.' };

  // Usage direct
  const directUsage = subject._count.courseContents + subject._count.homeworks;
  // Usage des enfants (bloque aussi la suppression cascade)
  const childrenUsage = subject.children.reduce(
    (sum, c) => sum + c._count.courseContents + c._count.homeworks,
    0,
  );
  const totalUsage = directUsage + childrenUsage;

  if (totalUsage > 0) {
    return {
      error: `Cette matière (ou ses sous-matières) est utilisée dans ${totalUsage} contenu(s)/devoir(s). Supprimez-les d'abord.`,
    };
  }

  // Supprime d'abord les liens teacher-subject pour la matière et ses enfants
  const idsToUnlink = [id, ...subject.children.map((c) => c.id)];
  await prisma.teacherSubject.deleteMany({ where: { subjectId: { in: idsToUnlink } } });

  // onDelete: Cascade supprimera les enfants automatiquement
  await prisma.subject.delete({ where: { id } });

  revalidatePath('/admin/vie-scolaire/matieres');
  return { success: true };
}
