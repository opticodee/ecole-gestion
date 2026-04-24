import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Emploi du temps' };

import { requireAuth } from '@/lib/auth-utils';
import { getTimetableData } from '@/server/actions/timetable';
import { TimetablePage } from '@/components/modules/vie-scolaire/timetable/timetable-page';

export default async function EmploiDuTempsPage() {
  await requireAuth();
  const initialData = await getTimetableData();
  return <TimetablePage initialData={initialData} />;
}
