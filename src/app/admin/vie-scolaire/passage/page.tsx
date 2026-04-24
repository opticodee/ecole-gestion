import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Passage de classe' };

import { requireAuth } from '@/lib/auth-utils';
import { getTransitionOptions } from '@/server/actions/transitions';
import { TransitionsView } from '@/components/modules/vie-scolaire/transitions/transitions-view';

export default async function PassagePage() {
  await requireAuth();
  const options = await getTransitionOptions();
  return <TransitionsView options={options} />;
}
