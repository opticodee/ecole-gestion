import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Conseil de classe' };

import { requireAuth } from '@/lib/auth-utils';
import { getGradesSummaryOptions } from '@/server/actions/grades-summary';
import { CouncilView } from '@/components/modules/vie-scolaire/council/council-view';

export default async function CouncilPage() {
  await requireAuth();
  const options = await getGradesSummaryOptions();
  return <CouncilView options={options} />;
}
