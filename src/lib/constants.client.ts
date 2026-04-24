/**
 * Client-safe constants. NEVER import `@prisma/client` here — this file is
 * used by Client Components and must be resolvable in the browser bundle.
 *
 * Server Components / Server Actions can import from `@/lib/constants`
 * (the Prisma-typed wrapper), which re-exports these constants with the
 * Prisma `TimeSlot` enum typing.
 */

/**
 * String-literal union mirroring the Prisma `TimeSlot` enum. At runtime the
 * Prisma enum values are identical strings, so values are interchangeable.
 */
export type TimeSlotValue =
  | 'MERCREDI_PM'
  | 'SAMEDI_AM'
  | 'SAMEDI_PM'
  | 'DIMANCHE_AM'
  | 'DIMANCHE_PM';

/**
 * Les 5 demi-journées de cours autorisées.
 * Contrainte fondamentale du produit : l'école ne fonctionne que sur ces créneaux.
 */
export const TIME_SLOTS = [
  'MERCREDI_PM',
  'SAMEDI_AM',
  'SAMEDI_PM',
  'DIMANCHE_AM',
  'DIMANCHE_PM',
] as const satisfies readonly TimeSlotValue[];

/**
 * Libellés français pour chaque créneau.
 */
export const TIME_SLOT_LABELS: Record<TimeSlotValue, string> = {
  MERCREDI_PM: 'Mercredi après-midi',
  SAMEDI_AM: 'Samedi matin',
  SAMEDI_PM: 'Samedi après-midi',
  DIMANCHE_AM: 'Dimanche matin',
  DIMANCHE_PM: 'Dimanche après-midi',
};

/**
 * Mapping créneau → jour de la semaine (0 = dimanche, 3 = mercredi, 6 = samedi).
 * Compatible avec `Date.getDay()`.
 */
export const TIME_SLOT_DAY_OF_WEEK: Record<TimeSlotValue, number> = {
  MERCREDI_PM: 3,
  SAMEDI_AM: 6,
  SAMEDI_PM: 6,
  DIMANCHE_AM: 0,
  DIMANCHE_PM: 0,
};

/**
 * Jours de la semaine autorisés pour les cours (index JS Date.getDay()).
 * 0 = Dimanche, 3 = Mercredi, 6 = Samedi
 */
export const ALLOWED_DAYS_OF_WEEK = [0, 3, 6] as const;

/**
 * Vérifie si une date tombe un jour de cours autorisé (mercredi, samedi ou dimanche).
 */
export function isAllowedCourseDay(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 3 || day === 6;
}

/**
 * Retourne les créneaux possibles pour un jour donné.
 */
export function getTimeSlotsForDay(date: Date): TimeSlotValue[] {
  const day = date.getDay();
  switch (day) {
    case 3:
      return ['MERCREDI_PM'];
    case 6:
      return ['SAMEDI_AM', 'SAMEDI_PM'];
    case 0:
      return ['DIMANCHE_AM', 'DIMANCHE_PM'];
    default:
      return [];
  }
}

/**
 * Seuil d'alerte : nombre d'absences non justifiées déclenchant une alerte
 * sur le tableau de bord (par mois).
 * Puisque 1 élève = 1 classe = 1 créneau/semaine, 4 absences = 4 semaines manquées.
 */
export const ABSENCE_ALERT_THRESHOLD = 4;

/**
 * Seuil de retard en minutes au-delà duquel un retard est comptabilisé comme absence.
 */
export const LATE_TO_ABSENT_MINUTES = 15;

/**
 * Nombre maximum de demi-journées de cours par semaine.
 */
export const MAX_HALF_DAYS_PER_WEEK = 5;
