import { z } from 'zod';

export const teacherSchema = z.object({
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
  email: z
    .string()
    .trim()
    .min(1, "L'email est requis")
    .email('Email invalide')
    .max(255),
  phone: z
    .string()
    .trim()
    .min(1, 'Le téléphone est requis')
    .max(30),
  address: z.string().trim().max(255).optional().or(z.literal('')),
  dateOfBirth: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  specialization: z.string().trim().max(200).optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export type TeacherFormData = z.infer<typeof teacherSchema>;
