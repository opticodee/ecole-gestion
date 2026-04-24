import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth-utils';
import {
  getParentById,
  getStudentsForParentSelect,
} from '@/server/actions/parents';
import { getClassesForStudentSelect } from '@/server/actions/students';
import { ParentDetail } from '@/components/modules/vie-scolaire/parents/parent-detail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ParentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const [parent, students, classes] = await Promise.all([
    getParentById(id, schoolId),
    getStudentsForParentSelect(schoolId),
    getClassesForStudentSelect(schoolId),
  ]);

  if (!parent) notFound();

  return <ParentDetail parent={parent} students={students} classes={classes} />;
}
