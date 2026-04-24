import { TimeSlot } from '@prisma/client';

/**
 * Les 5 demi-journées de cours autorisées.
 * Contrainte fondamentale du produit : l'école ne fonctionne que sur ces créneaux.
 */
export const TIME_SLOTS = [
  TimeSlot.MERCREDI_PM,
  TimeSlot.SAMEDI_AM,
  TimeSlot.SAMEDI_PM,
  TimeSlot.DIMANCHE_AM,
  TimeSlot.DIMANCHE_PM,
] as const;

/**
 * Libellés français pour chaque créneau.
 */
export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  [TimeSlot.MERCREDI_PM]: 'Mercredi après-midi',
  [TimeSlot.SAMEDI_AM]: 'Samedi matin',
  [TimeSlot.SAMEDI_PM]: 'Samedi après-midi',
  [TimeSlot.DIMANCHE_AM]: 'Dimanche matin',
  [TimeSlot.DIMANCHE_PM]: 'Dimanche après-midi',
};

/**
 * Mapping créneau → jour de la semaine (0 = dimanche, 3 = mercredi, 6 = samedi).
 * Compatible avec `Date.getDay()`.
 */
export const TIME_SLOT_DAY_OF_WEEK: Record<TimeSlot, number> = {
  [TimeSlot.MERCREDI_PM]: 3,
  [TimeSlot.SAMEDI_AM]: 6,
  [TimeSlot.SAMEDI_PM]: 6,
  [TimeSlot.DIMANCHE_AM]: 0,
  [TimeSlot.DIMANCHE_PM]: 0,
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
export function getTimeSlotsForDay(date: Date): TimeSlot[] {
  const day = date.getDay();
  switch (day) {
    case 3:
      return [TimeSlot.MERCREDI_PM];
    case 6:
      return [TimeSlot.SAMEDI_AM, TimeSlot.SAMEDI_PM];
    case 0:
      return [TimeSlot.DIMANCHE_AM, TimeSlot.DIMANCHE_PM];
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
