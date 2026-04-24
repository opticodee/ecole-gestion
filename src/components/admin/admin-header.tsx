'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Menu, LogOut, User, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { YearSwitcher } from './year-switcher';
import { ThemeToggle } from './theme-toggle';

interface AdminUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DIRECTEUR: 'Directeur',
  PROFESSEUR: 'Professeur',
};

export function AdminHeader({ user, onMenuClick }: { user: AdminUser; onMenuClick?: () => void }) {
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const canSettings = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'DIRECTEUR';
  const canUsers = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  function handleSignOut() {
    signOut({ callbackUrl: '/login' });
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <span className="text-sm font-semibold text-primary hidden sm:inline">
          ACMSCHOOL
        </span>
        <div className="hidden md:block">
          <YearSwitcher />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <YearSwitcher />
        </div>
        <Badge className="hidden bg-primary/10 text-primary hover:bg-primary/15 sm:inline-flex">
          {roleLabel}
        </Badge>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted focus:outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">
              {user.firstName} {user.lastName}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium leading-tight">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/admin/profil" />}>
              <User className="mr-2 h-4 w-4" />
              Mon profil
            </DropdownMenuItem>
            {canSettings && (
              <DropdownMenuItem render={<Link href="/admin/parametres" />}>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
            )}
            {canUsers && (
              <DropdownMenuItem render={<Link href="/admin/utilisateurs" />}>
                <Users className="mr-2 h-4 w-4" />
                Utilisateurs
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
