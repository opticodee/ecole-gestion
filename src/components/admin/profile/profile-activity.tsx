'use client';

import { Activity, Clock, ShieldCheck } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDateTimeFR } from '@/lib/formatters';
import type { ProfileData } from '@/server/actions/profile';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrateur',
  DIRECTEUR: 'Directeur',
  PROFESSEUR: 'Professeur',
  PARENT: 'Parent',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  SUPER_ADMIN: 'Accès complet à toutes les fonctionnalités.',
  ADMIN: 'Gestion des utilisateurs, paramètres et modules.',
  DIRECTEUR: 'Supervision de l\'établissement et paramètres.',
  PROFESSEUR: 'Gestion de ses classes et évaluations.',
  PARENT: 'Consultation des informations de ses enfants.',
};

export function ProfileActivity({ profile }: { profile: ProfileData }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Mon activité</CardTitle>
        <CardDescription>Informations sur votre compte.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Dernière connexion
              </p>
              <p className="text-sm font-medium">
                {profile.lastLoginAt
                  ? formatDateTimeFR(profile.lastLoginAt)
                  : 'Jamais'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Rôle</p>
              <p className="text-sm font-medium">
                {ROLE_LABELS[profile.role] ?? profile.role}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {ROLE_DESCRIPTIONS[profile.role] ?? ''}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Membre depuis
              </p>
              <p className="text-sm font-medium">
                {formatDateTimeFR(profile.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
