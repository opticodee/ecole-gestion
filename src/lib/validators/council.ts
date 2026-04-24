import { z } from 'zod';

export const COUNCIL_DECISIONS = [
  'NONE',
  'FELICITATIONS',
  'COMPLIMENTS',
  'ENCOURAGEMENTS',
  'MISE_EN_GARDE_TRAVAIL',
  'MISE_EN_GARDE_COMPORTEMENT',
  'AVERTISSEMENT_TRAVAIL',
  'AVERTISSEMENT_COMPORTEMENT',
  'BLAME',
] as const;

export type CouncilDecision = (typeof COUNCIL_DECISIONS)[number];

export const councilEntrySchema = z.object({
  studentId: z.string().min(1),
  councilDecision: z.enum(COUNCIL_DECISIONS).nullable().optional(),
  councilObservation: z.string().trim().max(500).nullable().optional(),
});

export const councilPayloadSchema = z.object({
  classGroupId: z.string().min(1, 'La classe est requise'),
  period: z.number().int().min(1).max(3),
  entries: z.array(councilEntrySchema),
});

export type CouncilPayload = z.infer<typeof councilPayloadSchema>;

export const COUNCIL_DECISION_LABELS: Record<CouncilDecision, string> = {
  NONE: 'Aucune décision',
  FELICITATIONS: 'Félicitations',
  COMPLIMENTS: 'Compliments',
  ENCOURAGEMENTS: 'Encouragements',
  MISE_EN_GARDE_TRAVAIL: 'Mise en garde travail',
  MISE_EN_GARDE_COMPORTEMENT: 'Mise en garde comportement',
  AVERTISSEMENT_TRAVAIL: 'Avertissement travail',
  AVERTISSEMENT_COMPORTEMENT: 'Avertissement comportement',
  BLAME: 'Blâme',
};

export const COUNCIL_DECISION_COLORS: Record<CouncilDecision, string> = {
  NONE: 'border-gray-200 bg-gray-100 text-gray-700',
  FELICITATIONS: 'border-yellow-300 bg-yellow-100 text-yellow-900',
  COMPLIMENTS: 'border-emerald-300 bg-emerald-100 text-emerald-900',
  ENCOURAGEMENTS: 'border-teal-300 bg-teal-100 text-teal-900',
  MISE_EN_GARDE_TRAVAIL: 'border-orange-300 bg-orange-100 text-orange-900',
  MISE_EN_GARDE_COMPORTEMENT: 'border-orange-300 bg-orange-100 text-orange-900',
  AVERTISSEMENT_TRAVAIL: 'border-rose-300 bg-rose-100 text-rose-900',
  AVERTISSEMENT_COMPORTEMENT: 'border-rose-300 bg-rose-100 text-rose-900',
  BLAME: 'border-red-400 bg-red-100 text-red-900',
};
