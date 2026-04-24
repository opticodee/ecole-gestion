import { z } from 'zod';

export const subjectSchema = z.object({
  label: z.string().min(2, 'Le libellé doit contenir au moins 2 caractères').max(100),
  weeklyHours: z.coerce
    .number({ error: 'Veuillez saisir un nombre' })
    .min(0.5, 'Minimum 0.5 heure')
    .max(15, 'Maximum 15 heures'),
  parentId: z.string().optional().nullable(),
});

export type SubjectFormData = z.infer<typeof subjectSchema>;
