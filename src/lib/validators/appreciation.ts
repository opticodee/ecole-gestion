import { z } from 'zod';

export const appreciationEntrySchema = z.object({
  studentId: z.string().min(1),
  generalComment: z.string().trim().max(1000).nullable().optional(),
  subjectComments: z.record(z.string(), z.string().trim().max(1000)).optional(),
});

export const appreciationsPayloadSchema = z.object({
  classGroupId: z.string().min(1, 'La classe est requise'),
  period: z.number().int().min(1).max(3),
  entries: z.array(appreciationEntrySchema),
});

export type AppreciationEntry = z.infer<typeof appreciationEntrySchema>;
export type AppreciationsPayload = z.infer<typeof appreciationsPayloadSchema>;
