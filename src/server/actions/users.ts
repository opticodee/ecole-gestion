'use server';

import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-utils';
import { userCreateSchema, userUpdateSchema } from '@/lib/validators/user';

export async function getUsers(schoolId: string) {
  const users = await prisma.user.findMany({
    where: {
      schoolId,
      role: { in: ['ADMIN', 'DIRECTEUR', 'PROFESSEUR', 'SUPER_ADMIN'] },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      passwordHash: true,
      inviteToken: true,
      lastLoginAt: true,
      createdAt: true,
      teacher: { select: { id: true, _count: { select: { classGroups: true } } } },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    isActive: u.isActive,
    hasPassword: !!u.passwordHash,
    isInvited: !u.passwordHash && !!u.inviteToken,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    teacherClassCount: u.teacher?._count.classGroups ?? 0,
  }));
}

export type UserRow = Awaited<ReturnType<typeof getUsers>>[number];

function randomPassword(length = 12) {
  const charset =
    'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return out;
}

export async function createUser(data: Record<string, unknown>) {
  const session = await requireRole('ADMIN', 'SUPER_ADMIN');
  const schoolId = session.user.schoolId;

  const parsed = userCreateSchema.safeParse(data);
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

  const passwordHash = await hash(d.password, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        schoolId,
        email: d.email.toLowerCase(),
        passwordHash,
        role: d.role,
        firstName: d.firstName,
        lastName: d.lastName,
        isActive: true,
      },
    });

    if (d.role === 'PROFESSEUR') {
      await tx.teacher.create({
        data: { userId: user.id, schoolId, isActive: true },
      });
    }
  });

  revalidatePath('/admin/utilisateurs');
  return { success: true };
}

export async function updateUser(id: string, data: Record<string, unknown>) {
  const session = await requireRole('ADMIN', 'SUPER_ADMIN');
  const schoolId = session.user.schoolId;

  const parsed = userUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const d = parsed.data;

  const user = await prisma.user.findFirst({
    where: { id, schoolId },
    include: { teacher: true },
  });
  if (!user) return { error: 'Utilisateur introuvable.' };

  const emailOwner = await prisma.user.findFirst({
    where: {
      schoolId,
      email: d.email.toLowerCase(),
      NOT: { id },
    },
  });
  if (emailOwner) {
    return { error: 'Cet email est déjà utilisé par un autre utilisateur.' };
  }

  // Guard: if demoting a PROFESSEUR with classes, block
  if (user.role === 'PROFESSEUR' && d.role !== 'PROFESSEUR' && user.teacher) {
    const classCount = await prisma.classGroup.count({
      where: { schoolId, mainTeacherId: user.teacher.id },
    });
    if (classCount > 0) {
      return {
        error: `Impossible de changer le rôle : cet enseignant est assigné à ${classCount} classe(s). Réassignez-les d'abord.`,
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: {
        email: d.email.toLowerCase(),
        firstName: d.firstName,
        lastName: d.lastName,
        role: d.role,
      },
    });

    // Sync Teacher row depending on role transitions
    if (d.role === 'PROFESSEUR' && !user.teacher) {
      await tx.teacher.create({
        data: { userId: id, schoolId, isActive: true },
      });
    } else if (d.role !== 'PROFESSEUR' && user.teacher) {
      await tx.teacherSubject.deleteMany({ where: { teacherId: user.teacher.id } });
      await tx.teacher.delete({ where: { id: user.teacher.id } });
    }
  });

  revalidatePath('/admin/utilisateurs');
  return { success: true };
}

export async function resetUserPassword(id: string) {
  const session = await requireRole('ADMIN', 'SUPER_ADMIN');
  const schoolId = session.user.schoolId;

  const user = await prisma.user.findFirst({ where: { id, schoolId } });
  if (!user) return { error: 'Utilisateur introuvable.' };

  const newPassword = randomPassword(12);
  const passwordHash = await hash(newPassword, 10);

  await prisma.user.update({
    where: { id },
    data: { passwordHash, inviteToken: null, inviteExpiresAt: null },
  });

  revalidatePath('/admin/utilisateurs');
  return { success: true, password: newPassword };
}

export async function toggleUserActive(id: string) {
  const session = await requireRole('ADMIN', 'SUPER_ADMIN');
  const schoolId = session.user.schoolId;

  const user = await prisma.user.findFirst({ where: { id, schoolId } });
  if (!user) return { error: 'Utilisateur introuvable.' };

  // Prevent self-deactivation
  if (user.id === session.user.id && user.isActive) {
    return { error: 'Vous ne pouvez pas désactiver votre propre compte.' };
  }

  // Protect last admin
  if (user.isActive && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
    const adminCount = await prisma.user.count({
      where: {
        schoolId,
        isActive: true,
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      },
    });
    if (adminCount <= 1) {
      return { error: 'Impossible de désactiver le dernier administrateur actif.' };
    }
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });

  revalidatePath('/admin/utilisateurs');
  return { success: true, isActive: !user.isActive };
}

export async function deleteUser(id: string) {
  const session = await requireRole('ADMIN', 'SUPER_ADMIN');
  const schoolId = session.user.schoolId;

  const user = await prisma.user.findFirst({
    where: { id, schoolId },
    include: { teacher: true, parent: true },
  });
  if (!user) return { error: 'Utilisateur introuvable.' };

  // Prevent self-deletion
  if (user.id === session.user.id) {
    return { error: 'Vous ne pouvez pas supprimer votre propre compte.' };
  }

  // Protect last admin
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    const adminCount = await prisma.user.count({
      where: { schoolId, role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    });
    if (adminCount <= 1) {
      return { error: 'Impossible de supprimer le dernier administrateur.' };
    }
  }

  if (user.teacher) {
    const classCount = await prisma.classGroup.count({
      where: { schoolId, mainTeacherId: user.teacher.id },
    });
    if (classCount > 0) {
      return {
        error: `Cet enseignant est assigné à ${classCount} classe(s). Réassignez ses classes d'abord.`,
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    if (user.teacher) {
      await tx.teacherSubject.deleteMany({ where: { teacherId: user.teacher.id } });
      await tx.teacher.delete({ where: { id: user.teacher.id } });
    }
    if (user.parent) {
      await tx.parent.delete({ where: { id: user.parent.id } });
    }
    await tx.user.delete({ where: { id } });
  });

  revalidatePath('/admin/utilisateurs');
  return { success: true };
}

export async function generateRandomPassword() {
  return randomPassword(12);
}
