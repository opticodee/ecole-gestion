'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-utils';
import {
  DEFAULT_SCHOOL_SETTINGS,
  schoolUpdateSchema,
  type SchoolSettings,
} from '@/lib/validators/school';

export async function getSchool() {
  const session = await requireRole('ADMIN', 'SUPER_ADMIN', 'DIRECTEUR');
  const schoolId = session.user.schoolId;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });
  if (!school) return null;

  const rawSettings =
    school.settings && typeof school.settings === 'object'
      ? (school.settings as Record<string, unknown>)
      : {};

  const merged: SchoolSettings = {
    ...DEFAULT_SCHOOL_SETTINGS,
    ...rawSettings,
    mentionThresholds: {
      ...DEFAULT_SCHOOL_SETTINGS.mentionThresholds,
      ...((rawSettings.mentionThresholds as Record<string, number>) ?? {}),
    },
    timeSlotConfig: {
      ...DEFAULT_SCHOOL_SETTINGS.timeSlotConfig,
      ...((rawSettings.timeSlotConfig as SchoolSettings['timeSlotConfig']) ?? {}),
    },
  };

  return {
    id: school.id,
    name: school.name,
    code: school.code,
    description: school.description ?? '',
    address: school.address ?? '',
    phone: school.phone ?? '',
    contactEmail: school.contactEmail ?? '',
    website: school.website ?? '',
    settings: merged,
  };
}

export type SchoolData = NonNullable<Awaited<ReturnType<typeof getSchool>>>;

export async function updateSchool(data: Record<string, unknown>) {
  const session = await requireRole('ADMIN', 'SUPER_ADMIN', 'DIRECTEUR');
  const schoolId = session.user.schoolId;

  const parsed = schoolUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, description, address, phone, contactEmail, website, settings } =
    parsed.data;

  // Validate mention thresholds ordering
  const m = settings.mentionThresholds;
  if (!(m.excellent >= m.tresBien && m.tresBien >= m.bien && m.bien >= m.passable)) {
    return {
      error:
        'Les seuils de mention doivent être décroissants : Excellent ≥ Très bien ≥ Bien ≥ Passable.',
    };
  }

  // Validate time slots: start < end
  for (const [key, slot] of Object.entries(settings.timeSlotConfig)) {
    if (slot.enabled && slot.startTime >= slot.endTime) {
      return { error: `Créneau ${key} : l'heure de début doit être antérieure à l'heure de fin.` };
    }
  }

  await prisma.school.update({
    where: { id: schoolId },
    data: {
      name,
      description: description || null,
      address: address || null,
      phone: phone || null,
      contactEmail: contactEmail || null,
      website: website || null,
      settings: settings as unknown as object,
    },
  });

  revalidatePath('/admin/parametres');
  return { success: true };
}
