import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-utils';
import { getUsers } from '@/server/actions/users';
import { GlobalPageShell } from '@/components/admin/global-page-shell';
import { UserList } from '@/components/admin/users/user-list';

export const metadata: Metadata = { title: 'Utilisateurs' };

export default async function UsersPage() {
  const session = await requireAuth();
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/admin/modules');
  }

  const users = await getUsers(session.user.schoolId);

  return (
    <GlobalPageShell
      user={session.user}
      title="Gestion des utilisateurs"
      description="Créez et gérez les comptes administrateurs, directeurs et enseignants."
    >
      <UserList users={users} currentUserId={session.user.id} />
    </GlobalPageShell>
  );
}
