import { z } from 'zod';

const dateField = z.coerce.date({ error: 'Date invalide' });

export const academicYearSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(4, 'Le libellé doit contenir au moins 4 caractères')
      .max(50),
    startDate: dateField,
    endDate: dateField,
    trimestre1Start: dateField,
    trimestre1End: dateField,
    trimestre2Start: dateField,
    trimestre2End: dateField,
    trimestre3Start: dateField,
    trimestre3End: dateField,
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "La date de fin doit être après la date de début de l'année",
    path: ['endDate'],
  })
  .refine(
    (d) =>
      d.trimestre1Start >= d.startDate &&
      d.trimestre1End <= d.endDate &&
      d.trimestre2Start >= d.startDate &&
      d.trimestre2End <= d.endDate &&
      d.trimestre3Start >= d.startDate &&
      d.trimestre3End <= d.endDate,
    {
      message: "Les trimestres doivent être dans la plage de l'année",
      path: ['trimestre1Start'],
    },
  )
  .refine((d) => d.trimestre1End > d.trimestre1Start, {
    message: 'T1 : la date de fin doit être après la date de début',
    path: ['trimestre1End'],
  })
  .refine((d) => d.trimestre2End > d.trimestre2Start, {
    message: 'T2 : la date de fin doit être après la date de début',
    path: ['trimestre2End'],
  })
  .refine((d) => d.trimestre3End > d.trimestre3Start, {
    message: 'T3 : la date de fin doit être après la date de début',
    path: ['trimestre3End'],
  })
  .refine((d) => d.trimestre1End < d.trimestre2Start, {
    message: 'T1 doit se terminer avant le début de T2',
    path: ['trimestre2Start'],
  })
  .refine((d) => d.trimestre2End < d.trimestre3Start, {
    message: 'T2 doit se terminer avant le début de T3',
    path: ['trimestre3Start'],
  });

export type AcademicYearFormData = z.infer<typeof academicYearSchema>;
