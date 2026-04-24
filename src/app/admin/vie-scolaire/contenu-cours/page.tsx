import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Contenu de cours' };

import { requireAuth } from '@/lib/auth-utils';
import {
  getCourseContents,
  getClassesForCourseContentSelect,
  getTeachersForFilter,
} from '@/server/actions/course-contents';
import { CourseContentList } from '@/components/modules/vie-scolaire/course-contents/course-content-list';

export default async function CourseContentsPage() {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const [items, classes, teachers] = await Promise.all([
    getCourseContents(schoolId),
    getClassesForCourseContentSelect(schoolId),
    getTeachersForFilter(schoolId),
  ]);

  return (
    <CourseContentList items={items} classes={classes} teachers={teachers} />
  );
}
