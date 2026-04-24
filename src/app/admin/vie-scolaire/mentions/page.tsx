import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Mentions' };

import { requireAuth } from '@/lib/auth-utils';
import { getGradesSummaryOptions } from '@/server/actions/grades-summary';
import { MentionsView } from '@/components/modules/vie-scolaire/mentions/mentions-view';

export default async function MentionsPage() {
  await requireAuth();
  const options = await getGradesSummaryOptions();
  return <MentionsView options={options} />;
}
