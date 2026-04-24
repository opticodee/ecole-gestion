import { z } from 'zod';

const MENTION_ENUM = z.enum([
  'EXCELLENT',
  'TRES_BIEN',
  'BIEN',
  'PASSABLE',
  'INSUFFISANT',
  'ENCOURAGEMENTS',
  'FELICITATIONS',
  'AVERT_TRAVAIL',
  'AVERT_COMPORTEMENT',
]);

export const mentionEntrySchema = z.object({
  studentId: z.string().min(1),
  manualMention: MENTION_ENUM.nullable().optional(),
  councilComment: z.string().trim().max(1000).nullable().optional(),
});

export const mentionsPayloadSchema = z.object({
  classGroupId: z.string().min(1),
  period: z.number().int().min(1).max(3),
  entries: z.array(mentionEntrySchema),
});

export type MentionsPayload = z.infer<typeof mentionsPayloadSchema>;
