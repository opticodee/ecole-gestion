import { z } from 'zod';

export const levelSchema = z.object({
  label: z.string().min(2, 'Le libellé doit contenir au moins 2 caractères').max(100),
  capacity: z.coerce
    .number({ error: 'Veuillez saisir un nombre' })
    .int({ error: 'Le nombre doit être entier' })
    .min(1, 'Le nombre de places doit être au moins 1')
    .max(500, 'Le nombre de places ne peut dépasser 500'),
});

export type LevelFormData = z.infer<typeof levelSchema>;
