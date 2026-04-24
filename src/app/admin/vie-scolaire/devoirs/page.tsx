import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Devoirs' };

import { requireAuth } from '@/lib/auth-utils';
import { getHomeworks } from '@/server/actions/homeworks';
import {
  getClassesForCourseContentSelect,
  getTeachersForFilter,
} from '@/server/actions/course-contents';
import { HomeworkList } from '@/components/modules/vie-scolaire/homeworks/homework-list';

export default async function HomeworksPage() {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const [items, classes, teachers] = await Promise.all([
    getHomeworks(schoolId),
    getClassesForCourseContentSelect(schoolId),
    getTeachersForFilter(schoolId),
  ]);

  return <HomeworkList items={items} classes={classes} teachers={teachers} />;
}
