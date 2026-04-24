import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth-utils';
import { getProfile } from '@/server/actions/profile';
import { GlobalPageShell } from '@/components/admin/global-page-shell';
import { ProfileInfo } from '@/components/admin/profile/profile-info';
import { ProfilePassword } from '@/components/admin/profile/profile-password';
import { ProfileActivity } from '@/components/admin/profile/profile-activity';

export const metadata: Metadata = { title: 'Mon profil' };

export default async function ProfilePage() {
  const session = await requireAuth();
  const profile = await getProfile();

  return (
    <GlobalPageShell
      user={session.user}
      title="Mon profil"
      description="Vos informations personnelles et sécurité du compte."
    >
      {profile ? (
        <div className="space-y-6">
          <ProfileInfo profile={profile} />
          <ProfilePassword />
          <ProfileActivity profile={profile} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Profil introuvable.</p>
      )}
    </GlobalPageShell>
  );
}
