import { z } from 'zod';

export const userCreateSchema = z.object({
  firstName: z.string().trim().min(2, 'Le prénom doit contenir au moins 2 caractères').max(100),
  lastName: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  email: z
    .string()
    .trim()
    .min(1, "L'email est requis")
    .email('Email invalide')
    .max(255),
  role: z.enum(['ADMIN', 'DIRECTEUR', 'PROFESSEUR'], {
    error: 'Rôle invalide',
  }),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128),
});

export type UserCreateData = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  email: z.string().trim().email('Email invalide').max(255),
  role: z.enum(['ADMIN', 'DIRECTEUR', 'PROFESSEUR']),
});

export type UserUpdateData = z.infer<typeof userUpdateSchema>;
