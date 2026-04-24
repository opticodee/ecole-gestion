import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Notes & Moyennes' };

import { requireAuth } from '@/lib/auth-utils';
import { getGradesSummaryOptions } from '@/server/actions/grades-summary';
import { GradesSummaryView } from '@/components/modules/vie-scolaire/grades-summary/grades-summary-view';

export default async function NotesPage() {
  await requireAuth();
  const options = await getGradesSummaryOptions();
  return <GradesSummaryView options={options} />;
}
