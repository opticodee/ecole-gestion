import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-utils';
import { getSchool } from '@/server/actions/school';
import { GlobalPageShell } from '@/components/admin/global-page-shell';
import { SettingsForm } from '@/components/admin/settings/settings-form';

export const metadata: Metadata = { title: 'Paramètres' };

export default async function SettingsPage() {
  const session = await requireAuth();
  if (
    session.user.role !== 'ADMIN' &&
    session.user.role !== 'SUPER_ADMIN' &&
    session.user.role !== 'DIRECTEUR'
  ) {
    redirect('/admin/modules');
  }

  const school = await getSchool();

  return (
    <GlobalPageShell
      user={session.user}
      title="Paramètres de l'école"
      description="Gérez les informations et la configuration de votre établissement."
    >
      {school ? (
        <SettingsForm school={school} />
      ) : (
        <p className="text-sm text-muted-foreground">École introuvable.</p>
      )}
    </GlobalPageShell>
  );
}
