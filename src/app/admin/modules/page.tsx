import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Calculator,
  GraduationCap,
  MessageSquare,
  Settings,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import { requireAuth } from '@/lib/auth-utils';
import { ModulesHeader } from '@/components/admin/modules-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Modules',
};

type ModuleKey = 'vie-scolaire' | 'inscriptions' | 'comptabilite' | 'communication';

interface ModuleDef {
  key: ModuleKey;
  title: string;
  description: string;
  icon: typeof GraduationCap;
  href: string | null;
  active: boolean;
  accent: string;
  accentBg: string;
  hoverBorder: string;
  gradient?: string;
}

const MODULES: ModuleDef[] = [
  {
    key: 'vie-scolaire',
    title: 'Vie Scolaire',
    description:
      'Gestion des élèves, classes, appel, devoirs et suivi pédagogique',
    icon: GraduationCap,
    href: '/admin/vie-scolaire',
    active: true,
    accent: 'text-emerald-600 dark:text-emerald-400',
    accentBg: 'bg-emerald-100 dark:bg-emerald-500/15',
    hoverBorder: 'hover:border-emerald-400/60',
    gradient:
      'bg-gradient-to-br from-primary/5 via-transparent to-transparent dark:from-primary/10',
  },
  {
    key: 'inscriptions',
    title: 'Inscriptions',
    description:
      "Gestion des admissions, dossiers d'inscription et réinscriptions",
    icon: UserPlus,
    href: null,
    active: false,
    accent: 'text-blue-600 dark:text-blue-400',
    accentBg: 'bg-blue-100 dark:bg-blue-500/15',
    hoverBorder: 'hover:border-blue-400/60',
  },
  {
    key: 'comptabilite',
    title: 'Comptabilité',
    description: 'Suivi des paiements, facturation et gestion financière',
    icon: Calculator,
    href: null,
    active: false,
    accent: 'text-amber-600 dark:text-amber-400',
    accentBg: 'bg-amber-100 dark:bg-amber-500/15',
    hoverBorder: 'hover:border-amber-400/60',
  },
  {
    key: 'communication',
    title: 'Communication',
    description: 'Messagerie, notifications et échanges avec les parents',
    icon: MessageSquare,
    href: null,
    active: false,
    accent: 'text-purple-600 dark:text-purple-400',
    accentBg: 'bg-purple-100 dark:bg-purple-500/15',
    hoverBorder: 'hover:border-purple-400/60',
  },
];

interface AdminLinkDef {
  href: string;
  icon: typeof Settings;
  label: string;
  accent: string;
  accentBg: string;
}

export default async function ModulesPage() {
  const session = await requireAuth();
  const { firstName, role } = session.user;
  const year = new Date().getFullYear();
  const canUsers = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const canSettings = canUsers || role === 'DIRECTEUR';

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-[hsl(155_30%_97%)] to-white dark:from-[hsl(155_15%_10%)] dark:to-background"
    >
      {/* Radial spotlight top-right */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(16,185,129,0.10) 0%, rgba(255,255,255,0.08) 35%, transparent 70%)',
        }}
      />

      {/* Subtle dot pattern */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '22px 22px',
          color: 'currentColor',
        }}
      />

      <ModulesHeader user={session.user} />

      <main className="relative z-10 flex-1 px-4 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-5xl animate-fade-in">
          <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Bonjour, {firstName} 👋
            </h1>
            <p className="text-lg text-muted-foreground">
              Que souhaitez-vous faire aujourd&apos;hui&nbsp;?
            </p>
            <div
              aria-hidden
              className="mt-3 h-px w-full max-w-md"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(16,185,129,0.35), transparent)',
              }}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {MODULES.map((mod) => (
              <ModuleCard key={mod.key} module={mod} />
            ))}
          </div>

          <div className="mt-10">
            <div className="mb-4 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <h2 className="rounded-full bg-muted/50 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground backdrop-blur-sm">
                Administration
              </h2>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {canSettings && (
                <AdminLink
                  href="/admin/parametres"
                  icon={Settings}
                  label="Paramètres de l'école"
                  accent="text-emerald-600 dark:text-emerald-400"
                  accentBg="bg-emerald-100 dark:bg-emerald-500/15"
                />
              )}
              {canUsers && (
                <AdminLink
                  href="/admin/utilisateurs"
                  icon={Users}
                  label="Gestion des utilisateurs"
                  accent="text-blue-600 dark:text-blue-400"
                  accentBg="bg-blue-100 dark:bg-blue-500/15"
                />
              )}
              <AdminLink
                href="/admin/profil"
                icon={User}
                label="Mon profil"
                accent="text-purple-600 dark:text-purple-400"
                accentBg="bg-purple-100 dark:bg-purple-500/15"
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/60 bg-background/60 py-3 text-center text-[11px] tracking-wide text-muted-foreground/70 backdrop-blur-sm">
        ACMSCHOOL · Gestion scolaire · {year}
      </footer>
    </div>
  );
}

function AdminLink({
  href,
  icon: Icon,
  label,
  accent,
  accentBg,
}: AdminLinkDef) {
  return (
    <Link
      href={href}
      className="group flex h-16 items-center gap-3 rounded-xl border border-border/60 bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110',
          accentBg,
          accent,
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>
      {label}
    </Link>
  );
}

function ModuleCard({ module: mod }: { module: ModuleDef }) {
  const Icon = mod.icon;

  const cardInner = (
    <Card
      className={cn(
        'group/module relative flex min-h-[180px] flex-row items-start gap-5 border border-border/50 bg-card p-6 shadow-md transition-all duration-300 ease-out lg:min-h-[190px] lg:p-7',
        mod.active
          ? cn(
              'cursor-pointer hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl',
              mod.hoverBorder,
              mod.gradient,
            )
          : 'cursor-not-allowed opacity-60',
      )}
      aria-disabled={!mod.active}
    >
      <div
        className={cn(
          'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover/module:scale-110 lg:h-16 lg:w-16',
          mod.active ? cn(mod.accentBg, mod.accent) : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="h-7 w-7 lg:h-8 lg:w-8" />
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {mod.title}
          </h2>
          <Badge
            className={cn(
              'rounded-full border-transparent text-[10px] font-medium uppercase tracking-wider',
              mod.active
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'bg-muted text-muted-foreground animate-pulse-alert',
            )}
          >
            {mod.active ? 'Actif' : 'Bientôt'}
          </Badge>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {mod.description}
        </p>
      </div>
    </Card>
  );

  if (mod.active && mod.href) {
    return (
      <Link
        href={mod.href}
        className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {cardInner}
      </Link>
    );
  }

  return <div aria-disabled>{cardInner}</div>;
}
