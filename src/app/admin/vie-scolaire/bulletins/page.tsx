import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Bulletins' };

import { requireAuth } from '@/lib/auth-utils';
import { getGradesSummaryOptions } from '@/server/actions/grades-summary';
import { BulletinsView } from '@/components/modules/vie-scolaire/bulletins/bulletins-view';

export default async function BulletinsPage() {
  await requireAuth();
  const options = await getGradesSummaryOptions();
  return <BulletinsView options={options} />;
}
