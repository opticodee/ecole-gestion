import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth-utils';
import { getEvaluationById } from '@/server/actions/evaluations';
import { GradeEntry } from '@/components/modules/vie-scolaire/evaluations/grade-entry';

export default async function EvaluationNotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const evaluation = await getEvaluationById(id);
  if (!evaluation) notFound();

  return <GradeEntry evaluation={evaluation} />;
}
