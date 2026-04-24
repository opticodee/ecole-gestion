import { requireAuth } from '@/lib/auth-utils';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function VieScolaireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
