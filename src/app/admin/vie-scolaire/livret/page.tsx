import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Livret scolaire' };

import { requireAuth } from '@/lib/auth-utils';
import { getLivretStudents } from '@/server/actions/livret';
import { LivretView } from '@/components/modules/vie-scolaire/livret/livret-view';

export default async function LivretPage() {
  await requireAuth();
  const students = await getLivretStudents();
  return <LivretView students={students} />;
}
