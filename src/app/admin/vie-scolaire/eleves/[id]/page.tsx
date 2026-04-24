import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth-utils';
import {
  getStudentById,
  getClassesForStudentSelect,
} from '@/server/actions/students';
import { StudentDetail } from '@/components/modules/vie-scolaire/students/student-detail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const [student, classes] = await Promise.all([
    getStudentById(id, schoolId),
    getClassesForStudentSelect(schoolId),
  ]);

  if (!student) notFound();

  return <StudentDetail student={student} classes={classes} />;
}
