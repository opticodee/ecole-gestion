import { z } from 'zod';

export const gradeEntrySchema = z
  .object({
    studentId: z.string().min(1),
    score: z.coerce
      .number({ error: 'La note doit être un nombre' })
      .min(0, 'Note minimale 0')
      .max(100, 'Note maximale 100')
      .nullable()
      .optional(),
    isAbsent: z.boolean().default(false),
  })
  .refine((g) => g.isAbsent || g.score !== null, {
    message: 'Saisissez une note ou cochez "Absent"',
    path: ['score'],
  });

export const gradesPayloadSchema = z.object({
  evaluationId: z.string().min(1),
  grades: z.array(gradeEntrySchema),
  lock: z.boolean().default(false),
});

export type GradeEntry = z.infer<typeof gradeEntrySchema>;
export type GradesPayload = z.infer<typeof gradesPayloadSchema>;
