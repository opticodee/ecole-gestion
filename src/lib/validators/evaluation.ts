import { z } from 'zod';

export const evaluationSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(3, 'Le libellé doit contenir au moins 3 caractères')
      .max(200),
    mode: z.enum(['INDIVIDUAL', 'GROUP']).default('GROUP'),
    groupType: z.string().trim().max(100).optional().or(z.literal('')),
    studentId: z.string().optional().or(z.literal('')),
    classGroupId: z.string().min(1, 'La classe est requise'),
    teacherId: z.string().min(1, "L'enseignant est requis"),
    subjectId: z.string().min(1, 'La matière est requise'),
    subSubjectId: z.string().optional().or(z.literal('')),
    evaluationType: z.enum(['CONTROLE', 'EXAMEN']),
    date: z.coerce.date({ error: 'La date est requise' }),
    coefficient: z.coerce
      .number({ error: 'Le coefficient doit être un nombre' })
      .min(0.1, 'Minimum 0.1')
      .max(10, 'Maximum 10'),
    scale: z.coerce
      .number({ error: 'Le barème doit être un nombre' })
      .min(1, 'Minimum 1')
      .max(100, 'Maximum 100')
      .default(10),
  })
  .refine(
    (d) => (d.mode === 'INDIVIDUAL' ? !!d.studentId : true),
    {
      message: 'Un élève est requis en mode individuel',
      path: ['studentId'],
    },
  );

export type EvaluationFormData = z.infer<typeof evaluationSchema>;
