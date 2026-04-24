'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { ParentFilters } from './parent-filters';
import { ParentForm } from './parent-form';
import { ParentDeleteDialog } from './parent-delete-dialog';
import type { ParentRow } from '@/server/actions/parents';
import { RELATIONSHIP_LABELS } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 15;

interface StudentOption {
  id: string;
  firstName: string;
  lastName: string;
  classLabel: string;
}

interface ParentListProps {
  parents: ParentRow[];
  students: StudentOption[];
}

function RelationshipBadge({ relationship }: { relationship: string }) {
  const variants: Record<string, string> = {
    PERE: 'bg-blue-100 text-blue-700 border-blue-200',
    MERE: 'bg-pink-100 text-pink-700 border-pink-200',
    TUTEUR: 'bg-gray-100 text-gray-700 border-gray-200',
    AUTRE: 'bg-violet-100 text-violet-700 border-violet-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        variants[relationship] || '',
      )}
    >
      {RELATIONSHIP_LABELS[relationship] ?? relationship}
    </span>
  );
}

function AccountBadge({ status }: { status: string }) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        Actif
      </span>
    );
  }
  if (status === 'INVITED') {
    return (
      <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
        Invité
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      Non invité
    </span>
  );
}

export function ParentList({ parents, students }: ParentListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterRelation, setFilterRelation] = useState('');
  const [filterAccountStatus, setFilterAccountStatus] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editParent, setEditParent] = useState<ParentRow | null>(null);
  const [deleteParent, setDeleteParent] = useState<ParentRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parents.filter((p) => {
      if (q) {
        const hay = `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterRelation && p.relationship !== filterRelation) return false;
      if (filterAccountStatus && p.accountStatus !== filterAccountStatus) return false;
      return true;
    });
  }, [parents, search, filterRelation, filterAccountStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function openCreate() {
    setEditParent(null);
    setFormOpen(true);
  }

  function openEdit(p: ParentRow) {
    setEditParent(p);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditParent(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Parents / Familles{' '}
          <span className="ml-2 text-base font-normal text-muted-foreground">
            ({filtered.length})
          </span>
        </h1>
        <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4" />
          Ajouter un parent
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher (nom, prénom, email)..."
        />
        <ParentFilters
          filterRelation={filterRelation}
          onFilterRelation={(v) => {
            setFilterRelation(v);
            setPage(1);
          }}
          filterAccountStatus={filterAccountStatus}
          onFilterAccountStatus={(v) => {
            setFilterAccountStatus(v);
            setPage(1);
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="Aucun parent trouvé." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Relation</TableHead>
                  <TableHead>Enfant(s)</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.lastName}</TableCell>
                    <TableCell>{p.firstName}</TableCell>
                    <TableCell className="text-xs">{p.email}</TableCell>
                    <TableCell className="text-xs">{p.phone}</TableCell>
                    <TableCell>
                      <RelationshipBadge relationship={p.relationship} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.children.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          p.children.map((c) => (
                            <Link
                              key={c.id}
                              href={`/admin/vie-scolaire/eleves/${c.id}`}
                              className="rounded-md bg-muted px-1.5 py-0.5 text-xs hover:bg-primary/10 hover:text-primary"
                            >
                              {c.firstName}
                            </Link>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <AccountBadge status={p.accountStatus} />
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
                          <DropdownMenuItem render={<Link href={`/admin/vie-scolaire/parents/${p.id}`} />}>
                            Voir la fiche
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(p)}>
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toast.info('Messagerie bientôt disponible.')
                            }
                          >
                            Contacter
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(p)}>
                            Ajouter un enfant
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteParent(p)}
                          >
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
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} sur {totalPages} — {filtered.length} parent(s)
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
        <ParentForm
          open={formOpen}
          onClose={() => {
            closeForm();
            router.refresh();
          }}
          parent={editParent}
          students={students}
        />
      )}

      {deleteParent && (
        <ParentDeleteDialog
          open={!!deleteParent}
          onClose={() => setDeleteParent(null)}
          parent={deleteParent}
          onDeleted={() => router.refresh()}
        />
      )}
    </div>
  );
}
