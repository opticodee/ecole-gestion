import { z } from 'zod';

const TIME_RE = /^([0-1]\d|2[0-3]):[0-5]\d$/;

export const timeSlotConfigSchema = z.object({
  enabled: z.boolean(),
  startTime: z.string().regex(TIME_RE, 'Heure invalide (HH:MM)'),
  endTime: z.string().regex(TIME_RE, 'Heure invalide (HH:MM)'),
});

export const schoolSettingsSchema = z.object({
  defaultScale: z
    .number()
    .int('Doit être un entier')
    .min(5, 'Minimum 5')
    .max(100, 'Maximum 100'),
  absenceThreshold: z
    .number()
    .int('Doit être un entier')
    .min(1, 'Minimum 1')
    .max(50, 'Maximum 50'),
  lateToAbsentMinutes: z
    .number()
    .int('Doit être un entier')
    .min(1, 'Minimum 1')
    .max(120, 'Maximum 120'),
  defaultPeriodType: z.enum(['TRIMESTRE', 'SEMESTRE', 'BIMESTRE']),
  mentionThresholds: z.object({
    excellent: z.number().min(0).max(100),
    tresBien: z.number().min(0).max(100),
    bien: z.number().min(0).max(100),
    passable: z.number().min(0).max(100),
  }),
  timeSlotConfig: z.object({
    MERCREDI_PM: timeSlotConfigSchema,
    SAMEDI_AM: timeSlotConfigSchema,
    SAMEDI_PM: timeSlotConfigSchema,
    DIMANCHE_AM: timeSlotConfigSchema,
    DIMANCHE_PM: timeSlotConfigSchema,
  }),
});

export type SchoolSettings = z.infer<typeof schoolSettingsSchema>;

export const schoolInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le nom de l'école est requis")
    .max(200, 'Maximum 200 caractères'),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  contactEmail: z
    .string()
    .trim()
    .max(255)
    .email('Email invalide')
    .optional()
    .or(z.literal('')),
  website: z.string().trim().max(255).optional().or(z.literal('')),
});

export type SchoolInfo = z.infer<typeof schoolInfoSchema>;

export const schoolUpdateSchema = schoolInfoSchema.extend({
  settings: schoolSettingsSchema,
});

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  defaultScale: 10,
  absenceThreshold: 4,
  lateToAbsentMinutes: 15,
  defaultPeriodType: 'TRIMESTRE',
  mentionThresholds: {
    excellent: 9,
    tresBien: 8,
    bien: 7,
    passable: 5,
  },
  timeSlotConfig: {
    MERCREDI_PM: { enabled: true, startTime: '14:00', endTime: '17:00' },
    SAMEDI_AM: { enabled: true, startTime: '09:00', endTime: '12:00' },
    SAMEDI_PM: { enabled: true, startTime: '14:00', endTime: '17:00' },
    DIMANCHE_AM: { enabled: true, startTime: '09:00', endTime: '12:00' },
    DIMANCHE_PM: { enabled: true, startTime: '14:00', endTime: '17:00' },
  },
};
