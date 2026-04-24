import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Appréciations' };

import { requireAuth } from '@/lib/auth-utils';
import { getGradesSummaryOptions } from '@/server/actions/grades-summary';
import { AppreciationsView } from '@/components/modules/vie-scolaire/appreciations/appreciations-view';

export default async function AppreciationsPage() {
  await requireAuth();
  const options = await getGradesSummaryOptions();
  return <AppreciationsView options={options} />;
}
