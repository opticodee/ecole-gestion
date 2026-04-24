import { z } from 'zod';

export const courseContentSchema = z
  .object({
    classGroupId: z.string().min(1, 'La classe est requise'),
    date: z.coerce.date({ error: 'La date est requise' }).refine(
      (d) => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return d.getTime() <= today.getTime();
      },
      { message: 'La date ne peut pas être dans le futur' },
    ),
    title: z
      .string()
      .trim()
      .min(5, 'Le titre doit contenir au moins 5 caractères')
      .max(200),
    content: z
      .string()
      .trim()
      .min(20, 'Le contenu doit contenir au moins 20 caractères')
      .max(5000),
    objectives: z.string().trim().max(2000).optional().or(z.literal('')),
    remarks: z.string().trim().max(2000).optional().or(z.literal('')),
  });

export type CourseContentFormData = z.infer<typeof courseContentSchema>;
