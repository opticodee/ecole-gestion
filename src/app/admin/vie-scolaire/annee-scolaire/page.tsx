import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Année scolaire' };

import { requireAuth } from '@/lib/auth-utils';
import { getAcademicYears } from '@/server/actions/academic-years';
import { AcademicYearList } from '@/components/modules/vie-scolaire/academic-years/academic-year-list';

export default async function AcademicYearPage() {
  await requireAuth();
  const years = await getAcademicYears();
  return <AcademicYearList years={years} />;
}
