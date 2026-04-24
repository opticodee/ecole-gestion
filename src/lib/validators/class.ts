import { z } from 'zod';

export const classSchema = z.object({
  label: z.string().min(2, 'Le libellé doit contenir au moins 2 caractères').max(100),
  levelId: z.string().min(1, 'Le niveau est requis'),
  classGender: z.enum(['FILLE', 'GARCON', 'MIXTE']),
  periodType: z.enum(['TRIMESTRE', 'SEMESTRE', 'BIMESTRE', 'PERIODE']),
  capacity: z.coerce
    .number({ error: 'Veuillez saisir un nombre' })
    .int({ error: 'Le nombre doit être entier' })
    .min(1, 'Minimum 1 place')
    .max(100, 'Maximum 100 places'),
  teacherId: z.string().optional(),
  timeSlot: z.enum(['MERCREDI_PM', 'SAMEDI_AM', 'SAMEDI_PM', 'DIMANCHE_AM', 'DIMANCHE_PM']),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  room: z.string().max(50).optional(),
});

export type ClassFormData = z.infer<typeof classSchema>;
