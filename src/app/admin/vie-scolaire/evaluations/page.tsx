import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Évaluations' };

import { requireAuth } from '@/lib/auth-utils';
import {
  getEvaluations,
  getEvaluationOptions,
} from '@/server/actions/evaluations';
import { EvaluationList } from '@/components/modules/vie-scolaire/evaluations/evaluation-list';

export default async function EvaluationsPage() {
  const session = await requireAuth();
  const [items, options] = await Promise.all([
    getEvaluations(session.user.schoolId),
    getEvaluationOptions(session.user.schoolId),
  ]);

  return <EvaluationList items={items} options={options} />;
}
