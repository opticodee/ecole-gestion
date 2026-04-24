/**
 * Client-safe constants and types for academic years.
 * Server-only helpers (getActiveAcademicYear, assertYearNotClosed) live in
 * `src/server/actions/academic-years.ts`.
 */

export type AcademicYearStatus = 'BROUILLON' | 'ACTIVE' | 'CLOTUREE';

export const ACADEMIC_YEAR_STATUS_LABELS: Record<AcademicYearStatus, string> = {
  BROUILLON: 'Brouillon',
  ACTIVE: 'Active',
  CLOTUREE: 'Clôturée',
};

export const ACADEMIC_YEAR_STATUS_COLORS: Record<
  AcademicYearStatus,
  { border: string; badge: string; accent: string }
> = {
  BROUILLON: {
    border: 'border-l-orange-500',
    badge: 'border-orange-200 bg-orange-100 text-orange-700',
    accent: 'text-orange-700',
  },
  ACTIVE: {
    border: 'border-l-emerald-500',
    badge: 'border-emerald-200 bg-emerald-100 text-emerald-700',
    accent: 'text-emerald-700',
  },
  CLOTUREE: {
    border: 'border-l-gray-400',
    badge: 'border-gray-200 bg-gray-100 text-gray-600',
    accent: 'text-gray-600',
  },
};
