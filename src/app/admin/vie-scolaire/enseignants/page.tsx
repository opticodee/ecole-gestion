import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Enseignants' };

import { requireAuth } from '@/lib/auth-utils';
import { getTeachers } from '@/server/actions/teachers';
import { TeacherList } from '@/components/modules/vie-scolaire/teachers/teacher-list';

export default async function TeachersPage() {
  const session = await requireAuth();
  const teachers = await getTeachers(session.user.schoolId);
  return <TeacherList teachers={teachers} />;
}
