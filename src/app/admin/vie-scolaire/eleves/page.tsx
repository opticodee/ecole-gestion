import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Élèves' };

import { requireAuth } from '@/lib/auth-utils';
import {
  getStudents,
  getClassesForStudentSelect,
  getLevelsForStudentSelect,
} from '@/server/actions/students';
import { StudentList } from '@/components/modules/vie-scolaire/students/student-list';

export default async function StudentsPage() {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const [students, classes, levels] = await Promise.all([
    getStudents(schoolId),
    getClassesForStudentSelect(schoolId),
    getLevelsForStudentSelect(schoolId),
  ]);

  return <StudentList students={students} classes={classes} levels={levels} />;
}
