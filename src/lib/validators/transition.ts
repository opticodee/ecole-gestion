import { z } from 'zod';

export const TRANSITION_DECISIONS = [
  'EN_ATTENTE',
  'PASSAGE',
  'REDOUBLEMENT',
  'DEPART',
] as const;

export type TransitionDecisionValue = (typeof TRANSITION_DECISIONS)[number];

export const transitionEntrySchema = z.object({
  studentId: z.string().min(1),
  decision: z.enum(TRANSITION_DECISIONS),
  toClassGroupId: z.string().nullable().optional(),
  toLevelId: z.string().nullable().optional(),
  observation: z.string().trim().max(500).nullable().optional(),
});

export const transitionsPayloadSchema = z.object({
  classGroupId: z.string().min(1),
  entries: z.array(transitionEntrySchema),
});

export type TransitionsPayload = z.infer<typeof transitionsPayloadSchema>;

export const TRANSITION_DECISION_LABELS: Record<TransitionDecisionValue, string> = {
  EN_ATTENTE: 'En attente',
  PASSAGE: 'Passage en classe supérieure',
  REDOUBLEMENT: 'Redoublement',
  DEPART: 'Départ de l\'école',
};

export const TRANSITION_DECISION_SHORT: Record<TransitionDecisionValue, string> = {
  EN_ATTENTE: 'En attente',
  PASSAGE: 'Passage',
  REDOUBLEMENT: 'Redoublement',
  DEPART: 'Départ',
};

export const TRANSITION_DECISION_COLORS: Record<TransitionDecisionValue, string> = {
  EN_ATTENTE: 'border-gray-200 bg-gray-100 text-gray-700',
  PASSAGE: 'border-emerald-300 bg-emerald-100 text-emerald-900',
  REDOUBLEMENT: 'border-orange-300 bg-orange-100 text-orange-900',
  DEPART: 'border-red-300 bg-red-100 text-red-900',
};
