/**
 * Shared helpers for bulletin chain: periods, averages, ranks, mentions.
 */

export type PeriodKey = 'T1' | 'T2' | 'T3' | 'ALL';

export const PERIODS: { key: PeriodKey; label: string; short: string; periodNumber: number | null }[] = [
  { key: 'T1', label: 'Trimestre 1', short: 'T1', periodNumber: 1 },
  { key: 'T2', label: 'Trimestre 2', short: 'T2', periodNumber: 2 },
  { key: 'T3', label: 'Trimestre 3', short: 'T3', periodNumber: 3 },
  { key: 'ALL', label: 'Année complète', short: 'Année', periodNumber: null },
];

export const SAISIE_PERIODS = PERIODS.filter((p) => p.periodNumber !== null);

/**
 * Trimester boundaries for a given academic year (Sept Y1 → June Y2).
 * T1 = sept-dec of Y1, T2 = jan-mar of Y2, T3 = apr-jun of Y2.
 */
export function getPeriodRange(
  key: PeriodKey,
  academicYearStart: Date,
  academicYearEnd: Date,
): { start: Date; end: Date } {
  const y1 = academicYearStart.getFullYear();
  const y2 = academicYearEnd.getFullYear();
  switch (key) {
    case 'T1':
      return { start: new Date(y1, 8, 1), end: new Date(y1, 11, 31, 23, 59, 59, 999) };
    case 'T2':
      return { start: new Date(y2, 0, 1), end: new Date(y2, 2, 31, 23, 59, 59, 999) };
    case 'T3':
      return { start: new Date(y2, 3, 1), end: new Date(y2, 5, 30, 23, 59, 59, 999) };
    case 'ALL':
    default:
      return { start: academicYearStart, end: academicYearEnd };
  }
}

export function periodKeyFromNumber(n: number): PeriodKey {
  if (n === 1) return 'T1';
  if (n === 2) return 'T2';
  return 'T3';
}

export function periodNumberFromKey(key: PeriodKey): number | null {
  const p = PERIODS.find((x) => x.key === key);
  return p?.periodNumber ?? null;
}

/**
 * Short evaluation label: "C1 12/10" or "E1 15/12"
 */
export function shortEvaluationLabel(
  type: string,
  date: Date,
  indexInType: number,
): string {
  const prefix = type === 'EXAMEN' ? 'E' : 'C';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${prefix}${indexInType} ${dd}/${mm}`;
}

/**
 * Weighted average: sum(score * coeff) / sum(coeff).
 * Excludes grades where isAbsent=true or score is null/undefined.
 * Returns null if no graded grade.
 */
export function weightedAverage(
  grades: { score: number | null | undefined; isAbsent: boolean; coefficient: number }[],
): number | null {
  let sum = 0;
  let weights = 0;
  for (const g of grades) {
    if (g.isAbsent) continue;
    if (g.score === null || g.score === undefined) continue;
    sum += g.score * g.coefficient;
    weights += g.coefficient;
  }
  if (weights === 0) return null;
  return sum / weights;
}

/**
 * Simple average (unweighted).
 */
export function simpleAverage(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Rank students by average (1 = best). Students with null average are ranked last (tied).
 */
export function computeRanks(
  students: { id: string; average: number | null }[],
): Map<string, number> {
  const sorted = [...students].sort((a, b) => {
    if (a.average === null && b.average === null) return 0;
    if (a.average === null) return 1;
    if (b.average === null) return -1;
    return b.average - a.average;
  });
  const ranks = new Map<string, number>();
  let currentRank = 0;
  let lastAverage: number | null | undefined;
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (s.average !== lastAverage) {
      currentRank = i + 1;
      lastAverage = s.average;
    }
    ranks.set(s.id, currentRank);
  }
  return ranks;
}

export type MentionKey =
  | 'EXCELLENT'
  | 'TRES_BIEN'
  | 'BIEN'
  | 'PASSABLE'
  | 'INSUFFISANT'
  | 'ENCOURAGEMENTS'
  | 'FELICITATIONS'
  | 'AVERT_TRAVAIL'
  | 'AVERT_COMPORTEMENT';

export const MENTION_LABELS: Record<MentionKey, string> = {
  EXCELLENT: 'Excellent',
  TRES_BIEN: 'Très bien',
  BIEN: 'Bien',
  PASSABLE: 'Passable',
  INSUFFISANT: 'Insuffisant',
  ENCOURAGEMENTS: 'Encouragements',
  FELICITATIONS: 'Félicitations',
  AVERT_TRAVAIL: 'Avertissement travail',
  AVERT_COMPORTEMENT: 'Avertissement comportement',
};

export const MENTION_OPTIONS: { value: MentionKey; label: string }[] = (
  Object.keys(MENTION_LABELS) as MentionKey[]
).map((k) => ({ value: k, label: MENTION_LABELS[k] }));

/** Badge color classes (Tailwind) for each mention. */
export const MENTION_COLORS: Record<MentionKey, string> = {
  EXCELLENT: 'border-yellow-300 bg-yellow-100 text-yellow-900',
  TRES_BIEN: 'border-emerald-300 bg-emerald-100 text-emerald-900',
  BIEN: 'border-blue-300 bg-blue-100 text-blue-900',
  PASSABLE: 'border-orange-300 bg-orange-100 text-orange-900',
  INSUFFISANT: 'border-red-300 bg-red-100 text-red-900',
  ENCOURAGEMENTS: 'border-teal-300 bg-teal-100 text-teal-900',
  FELICITATIONS: 'border-amber-300 bg-amber-100 text-amber-900',
  AVERT_TRAVAIL: 'border-rose-300 bg-rose-100 text-rose-900',
  AVERT_COMPORTEMENT: 'border-pink-300 bg-pink-100 text-pink-900',
};

/**
 * Compute auto mention from overall average (on 10 scale).
 */
export function computeAutoMention(average: number | null): MentionKey | null {
  if (average === null) return null;
  if (average >= 9) return 'EXCELLENT';
  if (average >= 8) return 'TRES_BIEN';
  if (average >= 7) return 'BIEN';
  if (average >= 5) return 'PASSABLE';
  return 'INSUFFISANT';
}

/** Grade color (on 10 scale). */
export function scoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score >= 8) return 'text-emerald-700 font-semibold';
  if (score >= 5) return 'text-orange-600';
  return 'text-red-600 font-semibold';
}

/** General-average row background color (on 10 scale). */
export function averageBgColor(avg: number | null): string {
  if (avg === null) return '';
  if (avg >= 9) return 'bg-emerald-50';
  if (avg < 5) return 'bg-red-50';
  return '';
}

/** Formats an average value to 2 decimals, or "—". */
export function formatAverage(avg: number | null | undefined): string {
  if (avg === null || avg === undefined || !Number.isFinite(avg)) return '—';
  return avg.toFixed(2);
}

/**
 * Suggested appreciation phrases.
 */
export const APPRECIATION_SUGGESTIONS = [
  'Excellent travail, continue ainsi',
  "Bon trimestre dans l'ensemble",
  'Des progrès encourageants',
  'Peut mieux faire, doit fournir plus d\'efforts',
  'Résultats insuffisants, un travail régulier est nécessaire',
  'Comportement exemplaire',
  'Bonne participation en classe',
];
