import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Matières' };

import { requireAuth } from '@/lib/auth-utils';
import { getSubjects } from '@/server/actions/subjects';
import { SubjectList } from '@/components/modules/vie-scolaire/subjects/subject-list';

export default async function MatieresPage() {
  const session = await requireAuth();
  const subjects = await getSubjects(session.user.schoolId);

  return <SubjectList subjects={subjects} />;
}
