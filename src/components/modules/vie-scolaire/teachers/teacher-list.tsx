'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils';
import { GENDER_LABELS_STUDENT } from '@/lib/formatters';
import type { TeacherRow } from '@/server/actions/teachers';
import { TeacherFilters } from './teacher-filters';
import { TeacherForm } from './teacher-form';
import { TeacherDeleteDialog } from './teacher-delete-dialog';
import { TeacherExports } from './teacher-exports';

const PAGE_SIZE = 15;

function GenderBadge({ gender }: { gender: string | null }) {
  if (!gender) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const variants: Record<string, string> = {
    MALE: 'bg-blue-100 text-blue-700',
    FEMALE: 'bg-pink-100 text-pink-700',
  };
  return (
    <span
      className={cn(
        'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
        variants[gender] || '',
      )}
      title={GENDER_LABELS_STUDENT[gender]}
    >
      {gender === 'MALE' ? 'M' : 'F'}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        active
          ? 'border-green-200 bg-green-100 text-green-700'
          : 'border-gray-200 bg-gray-100 text-gray-600',
      )}
    >
      {active ? 'Actif' : 'Inactif'}
    </span>
  );
}

export function TeacherList({ teachers }: { teachers: TeacherRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<TeacherRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeacherRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers.filter((t) => {
      if (q) {
        const full = `${t.firstName} ${t.lastName}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      if (filterStatus === 'ACTIVE' && !t.isActive) return false;
      if (filterStatus === 'INACTIVE' && t.isActive) return false;
      return true;
    });
  }, [teachers, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function openCreate() {
    setEditTeacher(null);
    setFormOpen(true);
  }
  function openEdit(t: TeacherRow) {
    setEditTeacher(t);
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false);
    setEditTeacher(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            Enseignants{' '}
            <span className="ml-2 text-base font-normal text-muted-foreground">
              ({filtered.length})
            </span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TeacherExports teachers={filtered} />
          <Button onClick={openCreate} className="no-print bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4" />
            Ajouter un enseignant
          </Button>
        </div>
      </div>

      <div className="no-print flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher par nom ou prénom..."
        />
        <TeacherFilters
          filterStatus={filterStatus}
          onFilterStatus={(v) => {
            setFilterStatus(v);
            setPage(1);
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="Aucun enseignant trouvé." />
      ) : (
        <>
          <div className="print-container overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead>Genre</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Classes assignées</TableHead>
                  <TableHead className="text-center">Nb</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="no-print w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <GenderBadge gender={t.gender} />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/vie-scolaire/enseignants/${t.id}`}
                        className="hover:underline"
                      >
                        {t.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>{t.firstName}</TableCell>
                    <TableCell className="text-xs">{t.email}</TableCell>
                    <TableCell className="text-xs">{t.phone ?? '—'}</TableCell>
                    <TableCell>
                      {t.classes.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {t.classes.map((c) => (
                            <Link
                              key={c.id}
                              href="/admin/vie-scolaire/classes"
                              className="no-underline"
                            >
                              <Badge
                                variant="secondary"
                                className="cursor-pointer text-[10px] hover:bg-primary/10"
                              >
                                {c.label}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-xs font-semibold">
                      {t.classCount}
                    </TableCell>
                    <TableCell>
                      <StatusBadge active={t.isActive} />
                    </TableCell>
                    <TableCell className="no-print">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            render={
                              <Link href={`/admin/vie-scolaire/enseignants/${t.id}`} />
                            }
                          >
                            Voir la fiche
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(t)}>
                            <Pencil className="h-3.5 w-3.5" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget(t)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="no-print flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} sur {totalPages} — {filtered.length} enseignant(s)
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
        <TeacherForm
          open={formOpen}
          onClose={() => {
            closeForm();
            router.refresh();
          }}
          teacher={editTeacher}
        />
      )}

      {deleteTarget && (
        <TeacherDeleteDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          teacher={deleteTarget}
          onDeleted={() => router.refresh()}
        />
      )}
    </div>
  );
}
