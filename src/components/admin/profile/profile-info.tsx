'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { updateProfile, type ProfileData } from '@/server/actions/profile';
import { formatDateFR } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DIRECTEUR: 'Directeur',
  PROFESSEUR: 'Professeur',
  PARENT: 'Parent',
};

const ROLE_BADGE_CLASSES: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700 border-red-200',
  ADMIN: 'bg-red-100 text-red-700 border-red-200',
  DIRECTEUR: 'bg-orange-100 text-orange-700 border-orange-200',
  PROFESSEUR: 'bg-blue-100 text-blue-700 border-blue-200',
  PARENT: 'bg-green-100 text-green-700 border-green-200',
};

export function ProfileInfo({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  const roleLabel = ROLE_LABELS[profile.role] ?? profile.role;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    setLoading(false);
    if ('error' in result && result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success('Profil mis à jour.');
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Mes informations</CardTitle>
        <CardDescription>
          Vos informations personnelles affichées dans l&apos;application.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {firstName} {lastName}
              </p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
              <span
                className={cn(
                  'mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                  ROLE_BADGE_CLASSES[profile.role] ?? 'bg-gray-100 text-gray-700',
                )}
              >
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-firstname">Prénom *</Label>
              <Input
                id="profile-firstname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-lastname">Nom *</Label>
              <Input
                id="profile-lastname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={profile.email}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Membre depuis</Label>
              <Input
                value={formatDateFR(profile.createdAt)}
                disabled
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
