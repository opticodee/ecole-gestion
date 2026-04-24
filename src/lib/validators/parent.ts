import { z } from 'zod';

export const parentSchema = z.object({
  gender: z.enum(['MALE', 'FEMALE'], { error: 'Le genre est requis' }),
  firstName: z
    .string()
    .trim()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100),
  lastName: z
    .string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100),
  email: z.string().trim().toLowerCase().email("L'email n'est pas valide"),
  phone: z
    .string()
    .trim()
    .regex(
      /^(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}$/,
      'Numéro de téléphone invalide (format français)',
    ),
  address: z.string().trim().max(255).optional().or(z.literal('')),
  relationship: z.enum(['PERE', 'MERE', 'TUTEUR', 'AUTRE'], {
    error: 'La relation est requise',
  }),
  childIds: z.array(z.string()).default([]),
});

export type ParentFormData = z.infer<typeof parentSchema>;
