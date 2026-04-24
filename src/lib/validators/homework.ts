import { z } from 'zod';

export const homeworkSchema = z
  .object({
    classGroupId: z.string().min(1, 'La classe est requise'),
    createdDate: z.coerce.date({ error: 'La date de création est requise' }),
    dueDate: z.coerce.date({ error: "La date d'échéance est requise" }),
    title: z
      .string()
      .trim()
      .min(5, 'Le titre doit contenir au moins 5 caractères')
      .max(200),
    description: z
      .string()
      .trim()
      .min(20, 'La description doit contenir au moins 20 caractères')
      .max(5000),
    instructions: z.string().trim().max(2000).optional().or(z.literal('')),
  })
  .refine((data) => data.dueDate.getTime() >= data.createdDate.getTime(), {
    message: "La date d'échéance doit être postérieure ou égale à la date de création",
    path: ['dueDate'],
  });

export type HomeworkFormData = z.infer<typeof homeworkSchema>;
