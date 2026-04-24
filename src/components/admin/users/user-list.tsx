'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Trash2,
  Users as UsersIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDateFR } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { UserRow } from '@/server/actions/users';
import { UserForm } from './user-form';
import { UserFilters } from './user-filters';
import { UserResetPasswordDialog } from './user-reset-password-dialog';
import { UserDeleteDialog } from './user-delete-dialog';
import { UserToggleActiveDialog } from './user-toggle-active-dialog';

const PAGE_SIZE = 15;

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

const AVATAR_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-green-500',
  'bg-teal-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-purple-500',
  'bg-pink-500',
];

function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        ROLE_BADGE_CLASSES[role] ?? 'bg-gray-100 text-gray-700',
      )}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function StatusBadge({ user }: { user: UserRow }) {
  if (!user.isActive) {
    return (
      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        Inactif
      </span>
    );
  }
  if (user.isInvited) {
    return (
      <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
        Invité
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      Actif
    </span>
  );
}

export function UserList({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UserRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (q) {
        const hay = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterRole && u.role !== filterRole) return false;
      if (filterStatus === 'ACTIVE' && !(u.isActive && u.hasPassword))
        return false;
      if (filterStatus === 'INVITED' && !u.isInvited) return false;
      if (filterStatus === 'INACTIVE' && u.isActive) return false;
      return true;
    });
  }, [users, search, filterRole, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function openCreate() {
    setEditUser(null);
    setFormOpen(true);
  }
  function openEdit(u: UserRow) {
    setEditUser(u);
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false);
    setEditUser(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">
            Utilisateurs{' '}
            <span className="ml-2 text-base font-normal text-muted-foreground">
              ({filtered.length})
            </span>
          </h2>
        </div>
        <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4" />
          Ajouter un utilisateur
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Rechercher par nom ou email..."
        />
        <UserFilters
          filterRole={filterRole}
          onFilterRole={(v) => {
            setFilterRole(v);
            setPage(1);
          }}
          filterStatus={filterStatus}
          onFilterStatus={(v) => {
            setFilterStatus(v);
            setPage(1);
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="Aucun utilisateur trouvé." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((u) => {
                  const initials = `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
                  const isSelf = u.id === currentUserId;
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback
                            className={cn(
                              'text-xs font-medium text-white',
                              avatarColor(u.id),
                            )}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {u.lastName} {u.firstName}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (vous)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{u.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge user={u} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.lastLoginAt ? formatDateFR(u.lastLoginAt) : 'Jamais'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(u)}>
                              <Pencil className="h-3.5 w-3.5" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setResetTarget(u)}>
                              <KeyRound className="h-3.5 w-3.5" />
                              Réinitialiser le mot de passe
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setToggleTarget(u)}
                              disabled={isSelf}
                            >
                              <Power className="h-3.5 w-3.5" />
                              {u.isActive ? 'Désactiver' : 'Activer'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(u)}
                              disabled={isSelf}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} sur {totalPages} — {filtered.length} utilisateur(s)
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const n = i + 1;
                  return (
                    <Button
                      key={n}
                      variant={n === currentPage ? 'default' : 'outline'}
                      size="icon-sm"
                      onClick={() => setPage(n)}
                      className="w-8"
                    >
                      {n}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {formOpen && (
        <UserForm
          open={formOpen}
          onClose={() => {
            closeForm();
            router.refresh();
          }}
          user={editUser}
        />
      )}

      {resetTarget && (
        <UserResetPasswordDialog
          open={!!resetTarget}
          onClose={() => setResetTarget(null)}
          user={resetTarget}
        />
      )}

      {toggleTarget && (
        <UserToggleActiveDialog
          open={!!toggleTarget}
          onClose={() => setToggleTarget(null)}
          user={toggleTarget}
          onDone={() => router.refresh()}
        />
      )}

      {deleteTarget && (
        <UserDeleteDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          user={deleteTarget}
          onDeleted={() => router.refresh()}
        />
      )}
    </div>
  );
}
