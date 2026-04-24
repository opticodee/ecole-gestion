'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { gradesPayloadSchema } from '@/lib/validators/grade';

export async function saveGrades(data: Record<string, unknown>) {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const parsed = gradesPayloadSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { evaluationId, grades, lock } = parsed.data;

  const evaluation = await prisma.evaluation.findFirst({
    where: { id: evaluationId, schoolId },
    include: {
      classGroup: {
        select: { students: { select: { id: true } } },
      },
    },
  });
  if (!evaluation) return { error: 'Évaluation introuvable.' };
  if (evaluation.isLocked) {
    return { error: 'Évaluation verrouillée — modification impossible.' };
  }

  const validStudentIds = new Set(evaluation.classGroup.students.map((s) => s.id));
  const invalidStudent = grades.find((g) => !validStudentIds.has(g.studentId));
  if (invalidStudent) {
    return { error: 'Un ou plusieurs élèves ne font pas partie de cette classe.' };
  }

  // Vérifie que toutes les notes respectent le barème
  const outOfRange = grades.find(
    (g) => !g.isAbsent && g.score !== null && g.score !== undefined && (g.score < 0 || g.score > evaluation.scale),
  );
  if (outOfRange) {
    return { error: `Une note est hors du barème (0 – ${evaluation.scale}).` };
  }

  // Si on verrouille, chaque élève doit avoir soit une note soit être marqué absent
  if (lock) {
    const gradesByStudent = new Map(grades.map((g) => [g.studentId, g]));
    for (const s of evaluation.classGroup.students) {
      const g = gradesByStudent.get(s.id);
      if (!g || (!g.isAbsent && (g.score === null || g.score === undefined))) {
        return { error: 'Chaque élève doit avoir une note ou être marqué absent avant de verrouiller.' };
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const g of grades) {
      await tx.grade.upsert({
        where: { evaluationId_studentId: { evaluationId, studentId: g.studentId } },
        create: {
          evaluationId,
          studentId: g.studentId,
          score: g.isAbsent ? null : (g.score ?? null),
          isAbsent: g.isAbsent,
        },
        update: {
          score: g.isAbsent ? null : (g.score ?? null),
          isAbsent: g.isAbsent,
        },
      });
    }
    if (lock) {
      await tx.evaluation.update({
        where: { id: evaluationId },
        data: { isLocked: true },
      });
    }
  });

  revalidatePath('/admin/vie-scolaire/evaluations');
  revalidatePath(`/admin/vie-scolaire/evaluations/${evaluationId}/notes`);
  return { success: true, locked: lock };
}
