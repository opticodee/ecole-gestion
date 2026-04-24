import { z } from 'zod';

export const attendanceEntrySchema = z
  .object({
    studentId: z.string().min(1),
    status: z.enum(['PRESENT', 'ABSENT', 'RETARD', 'EXCUSE']),
    lateMinutes: z.coerce.number().int().min(0).max(240).optional(),
    reason: z.string().trim().max(500).optional().or(z.literal('')),
  })
  .refine(
    (d) => d.status !== 'RETARD' || (d.lateMinutes ?? 0) >= 1,
    { message: 'Minutes de retard requises (≥ 1)', path: ['lateMinutes'] },
  );

export const attendanceSaveSchema = z.object({
  classGroupId: z.string().min(1, 'La classe est requise'),
  scheduleId: z.string().min(1, 'Le créneau est requis'),
  date: z.coerce.date({ error: 'La date est requise' }),
  entries: z.array(attendanceEntrySchema).min(1, 'Aucun élève'),
});

export type AttendanceEntryData = z.infer<typeof attendanceEntrySchema>;
export type AttendanceSaveData = z.infer<typeof attendanceSaveSchema>;
