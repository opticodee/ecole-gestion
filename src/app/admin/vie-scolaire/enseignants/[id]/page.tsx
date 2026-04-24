import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth-utils';
import { getTeacherById } from '@/server/actions/teachers';
import { TeacherDetail } from '@/components/modules/vie-scolaire/teachers/teacher-detail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TeacherDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireAuth();
  const teacher = await getTeacherById(id, session.user.schoolId);
  if (!teacher) notFound();
  return <TeacherDetail teacher={teacher} />;
}
