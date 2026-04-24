import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Parents' };

import { requireAuth } from '@/lib/auth-utils';
import { getParents, getStudentsForParentSelect } from '@/server/actions/parents';
import { ParentList } from '@/components/modules/vie-scolaire/parents/parent-list';

export default async function ParentsPage() {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const [parents, students] = await Promise.all([
    getParents(schoolId),
    getStudentsForParentSelect(schoolId),
  ]);

  return <ParentList parents={parents} students={students} />;
}
