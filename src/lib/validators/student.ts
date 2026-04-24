import { z } from 'zod';

export const studentSchema = z.object({
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
  dateOfBirth: z.coerce
    .date({ error: 'La date de naissance est requise' })
    .refine(
      (d) => {
        const today = new Date();
        let age = today.getFullYear() - d.getFullYear();
        const m = today.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
        return age >= 4 && age <= 20;
      },
      { message: "L'élève doit avoir entre 4 et 20 ans" },
    ),
  placeOfBirth: z.string().trim().max(100).optional().or(z.literal('')),
  address: z.string().trim().max(255).optional().or(z.literal('')),
  classGroupId: z.string().min(1, 'La classe est requise'),
  status: z.enum(['INSCRIT', 'EN_ATTENTE', 'RADIE']).default('INSCRIT'),
});

export type StudentFormData = z.infer<typeof studentSchema>;
