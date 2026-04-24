'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { parentSchema } from '@/lib/validators/parent';

export async function getParents(schoolId: string) {
  const parents = await prisma.parent.findMany({
    where: { schoolId },
    include: {
      user: {
        select: {
          passwordHash: true,
          inviteToken: true,
        },
      },
      children: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              classGroup: { select: { label: true } },
            },
          },
        },
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  return parents.map((p) => {
    const primary = p.children.find((c) => c.isPrimaryContact) ?? p.children[0];
    const accountStatus: 'ACTIVE' | 'INVITED' | 'NONE' = p.user.passwordHash
      ? 'ACTIVE'
      : p.user.inviteToken
        ? 'INVITED'
        : 'NONE';

    return {
      id: p.id,
      gender: p.gender,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone,
      address: p.address,
      relationship: primary?.relationship ?? 'AUTRE',
      accountStatus,
      children: p.children.map((c) => ({
        id: c.student.id,
        firstName: c.student.firstName,
        lastName: c.student.lastName,
        classLabel: c.student.classGroup.label,
        relationship: c.relationship,
      })),
    };
  });
}

export type ParentRow = Awaited<ReturnType<typeof getParents>>[number];

export async function getParentById(id: string, schoolId: string) {
  const parent = await prisma.parent.findFirst({
    where: { id, schoolId },
    include: {
      user: {
        select: { passwordHash: true, inviteToken: true },
      },
      children: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              gender: true,
              classGroup: {
                select: {
                  label: true,
                  level: { select: { label: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!parent) return null;

  const primary = parent.children.find((c) => c.isPrimaryContact) ?? parent.children[0];
  const accountStatus: 'ACTIVE' | 'INVITED' | 'NONE' = parent.user.passwordHash
    ? 'ACTIVE'
    : parent.user.inviteToken
      ? 'INVITED'
      : 'NONE';

  return {
    id: parent.id,
    gender: parent.gender,
    firstName: parent.firstName,
    lastName: parent.lastName,
    email: parent.email,
    phone: parent.phone,
    address: parent.address,
    relationship: primary?.relationship ?? 'AUTRE',
    accountStatus,
    children: parent.children.map((c) => ({
      linkId: c.id,
      id: c.student.id,
      firstName: c.student.firstName,
      lastName: c.student.lastName,
      gender: c.student.gender,
      classLabel: c.student.classGroup.label,
      levelLabel: c.student.classGroup.level.label,
      relationship: c.relationship,
      isPrimaryContact: c.isPrimaryContact,
    })),
  };
}

export type ParentDetail = NonNullable<Awaited<ReturnType<typeof getParentById>>>;

export async function getStudentsForParentSelect(schoolId: string) {
  const students = await prisma.student.findMany({
    where: { schoolId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      classGroup: { select: { label: true } },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
  return students.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    classLabel: s.classGroup.label,
  }));
}

export async function createParent(data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = parentSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.user.findFirst({
    where: { schoolId, email: parsed.data.email },
  });
  if (existing) {
    return { error: 'Un utilisateur avec cet email existe déjà.' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          schoolId,
          email: parsed.data.email,
          role: 'PARENT',
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          isActive: true,
        },
      });

      const parent = await tx.parent.create({
        data: {
          userId: user.id,
          schoolId,
          gender: parsed.data.gender,
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          address: parsed.data.address || null,
        },
      });

      for (let i = 0; i < parsed.data.childIds.length; i++) {
        const childId = parsed.data.childIds[i];
        const student = await tx.student.findFirst({
          where: { id: childId, schoolId },
          select: { id: true },
        });
        if (!student) continue;
        await tx.studentParent.create({
          data: {
            studentId: childId,
            parentId: parent.id,
            relationship: parsed.data.relationship,
            isPrimaryContact: i === 0,
          },
        });
      }
    });
  } catch {
    return { error: "Erreur lors de la création du parent." };
  }

  revalidatePath('/admin/vie-scolaire/parents');
  return { success: true };
}

export async function updateParent(id: string, data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = parentSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const parent = await prisma.parent.findFirst({
    where: { id, schoolId },
    include: { user: true },
  });
  if (!parent) return { error: 'Parent introuvable.' };

  if (parsed.data.email !== parent.email) {
    const existing = await prisma.user.findFirst({
      where: { schoolId, email: parsed.data.email, NOT: { id: parent.userId } },
    });
    if (existing) {
      return { error: 'Un utilisateur avec cet email existe déjà.' };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: parent.userId },
      data: {
        email: parsed.data.email,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
      },
    });

    await tx.parent.update({
      where: { id },
      data: {
        gender: parsed.data.gender,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        address: parsed.data.address || null,
      },
    });

    // Update relationship on existing links to match the new default
    await tx.studentParent.updateMany({
      where: { parentId: id },
      data: { relationship: parsed.data.relationship },
    });
  });

  revalidatePath('/admin/vie-scolaire/parents');
  revalidatePath(`/admin/vie-scolaire/parents/${id}`);
  return { success: true };
}

export async function deleteParent(id: string) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parent = await prisma.parent.findFirst({
    where: { id, schoolId },
  });
  if (!parent) return { error: 'Parent introuvable.' };

  await prisma.$transaction(async (tx) => {
    await tx.studentParent.deleteMany({ where: { parentId: id } });
    await tx.parent.delete({ where: { id } });
    await tx.user.delete({ where: { id: parent.userId } });
  });

  revalidatePath('/admin/vie-scolaire/parents');
  return { success: true };
}

export async function linkChild(
  parentId: string,
  studentId: string,
  relationship: 'PERE' | 'MERE' | 'TUTEUR' | 'AUTRE' = 'AUTRE',
) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const [parent, student] = await Promise.all([
    prisma.parent.findFirst({ where: { id: parentId, schoolId } }),
    prisma.student.findFirst({ where: { id: studentId, schoolId } }),
  ]);
  if (!parent) return { error: 'Parent introuvable.' };
  if (!student) return { error: 'Élève introuvable.' };

  const existing = await prisma.studentParent.findFirst({
    where: { parentId, studentId },
  });
  if (existing) return { error: 'Cet élève est déjà lié à ce parent.' };

  await prisma.studentParent.create({
    data: {
      parentId,
      studentId,
      relationship,
      isPrimaryContact: false,
    },
  });

  revalidatePath('/admin/vie-scolaire/parents');
  revalidatePath(`/admin/vie-scolaire/parents/${parentId}`);
  revalidatePath(`/admin/vie-scolaire/eleves/${studentId}`);
  return { success: true };
}

export async function unlinkChild(parentId: string, studentId: string) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parent = await prisma.parent.findFirst({
    where: { id: parentId, schoolId },
  });
  if (!parent) return { error: 'Parent introuvable.' };

  await prisma.studentParent.deleteMany({
    where: { parentId, studentId },
  });

  revalidatePath('/admin/vie-scolaire/parents');
  revalidatePath(`/admin/vie-scolaire/parents/${parentId}`);
  revalidatePath(`/admin/vie-scolaire/eleves/${studentId}`);
  return { success: true };
}
