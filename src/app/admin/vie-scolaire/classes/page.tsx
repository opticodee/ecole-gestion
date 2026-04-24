import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Classes' };

import { requireAuth } from '@/lib/auth-utils';
import { getClasses, getTeachersForSelect, getLevelsForSelect } from '@/server/actions/classes';
import { ClassList } from '@/components/modules/vie-scolaire/classes/class-list';

export default async function ClassesPage() {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const [classes, teachers, levels] = await Promise.all([
    getClasses(schoolId),
    getTeachersForSelect(schoolId),
    getLevelsForSelect(schoolId),
  ]);

  return <ClassList classes={classes} teachers={teachers} levels={levels} />;
}
