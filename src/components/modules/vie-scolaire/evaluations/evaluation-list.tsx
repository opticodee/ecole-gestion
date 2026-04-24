'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Unlock,
  SquarePen,
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
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { EvaluationFilters } from './evaluation-filters';
import { EvaluationForm } from './evaluation-form';
import { EvaluationDeleteDialog } from './evaluation-delete-dialog';
import { EvaluationExports } from './evaluation-exports';
import { formatDateFR } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type {
  EvaluationRow,
  EvaluationOptions,
} from '@/server/actions/evaluations';

const PAGE_SIZE = 10;

const TYPE_LABELS: Record<string, string> = {
  CONTROLE: 'Contrôle',
  EXAMEN: 'Examen',
};

interface Props {
  items: EvaluationRow[];
  options: EvaluationOptions;
}

export function EvaluationList({ items, options }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<EvaluationRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<EvaluationRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (q && !i.label.toLowerCase().includes(q)) return false;
      if (filterClass && i.classGroupId !== filterClass) return false;
      if (filterSubject) {
        // Accepte match sur parent ou sous-matière
        if (i.subjectId !== filterSubject && i.subSubjectId !== filterSubject) {
          return false;
        }
      }
      if (filterTeacher && i.teacherId !== filterTeacher) return false;
      if (filterType && i.evaluationType !== filterType) return false;
      if (filterStatus) {
        if (filterStatus === 'LOCKED' && !i.isLocked) return false;
        if (filterStatus === 'OPEN' && i.isLocked) return false;
      }
      return true;
    });
  }, [items, search, filterClass, filterSubject, filterTeacher, filterType, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const classOptions = options.classes.map((c) => ({ id: c.id, label: c.label }));
  const subjectOptions = options.subjects.map((s) => ({ id: s.id, label: s.label }));

  function openCreate() {
    setEditItem(null);
    setFormOpen(true);
  }

  function openEdit(i: EvaluationRow) {
    if (i.isLocked) return;
    setEditItem(i);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditItem(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Évaluations{' '}
          <span className="ml-2 text-base font-normal text-muted-foreground">
            ({filtered.length})
          </span>
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <EvaluationExports items={filtered} />
          <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4" />
            Nouvelle évaluation
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher par libellé..."
        />
        <EvaluationFilters
          classes={classOptions}
          subjects={subjectOptions}
          teachers={options.teachers}
          filterClass={filterClass}
          onFilterClass={(v) => {
            setFilterClass(v);
            setPage(1);
          }}
          filterSubject={filterSubject}
          onFilterSubject={(v) => {
            setFilterSubject(v);
            setPage(1);
          }}
          filterTeacher={filterTeacher}
          onFilterTeacher={(v) => {
            setFilterTeacher(v);
            setPage(1);
          }}
          filterType={filterType}
          onFilterType={(v) => {
            setFilterType(v);
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
        <EmptyState message="Aucune évaluation trouvée." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead>Libellé</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Enseignant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Coef.</TableHead>
                  <TableHead className="text-center">Barème</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/vie-scolaire/evaluations/${i.id}/notes`}
                        className="hover:underline"
                      >
                        {i.label}
                      </Link>
                    </TableCell>
                    <TableCell>{i.classLabel}</TableCell>
                    <TableCell className="text-xs">
                      {i.subjectLabel}
                      {i.subSubjectLabel && (
                        <span className="block text-muted-foreground">
                          › {i.subSubjectLabel}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{i.teacherName}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                          i.evaluationType === 'EXAMEN'
                            ? 'border-purple-200 bg-purple-100 text-purple-700'
                            : 'border-blue-200 bg-blue-100 text-blue-700',
                        )}
                      >
                        {TYPE_LABELS[i.evaluationType]}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatDateFR(i.date)}
                    </TableCell>
                    <TableCell className="text-center">{i.coefficient}</TableCell>
                    <TableCell className="text-center">/{i.scale}</TableCell>
                    <TableCell>
                      {i.isLocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          <Lock className="h-3 w-3" />
                          Verrouillé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          <Unlock className="h-3 w-3" />
                          En cours
                        </span>
                      )}
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
                          <DropdownMenuItem
                            render={
                              <Link href={`/admin/vie-scolaire/evaluations/${i.id}/notes`} />
                            }
                          >
                            <SquarePen className="h-3.5 w-3.5" />
                            {i.isLocked ? 'Voir les notes' : 'Saisir les notes'}
                          </DropdownMenuItem>
                          {!i.isLocked && (
                            <DropdownMenuItem onClick={() => openEdit(i)}>
                              <Pencil className="h-3.5 w-3.5" />
                              Modifier
                            </DropdownMenuItem>
                          )}
                          {!i.isLocked && (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteItem(i)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Supprimer
                            </DropdownMenuItem>
                          )}
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
                Page {currentPage} sur {totalPages} — {filtered.length} évaluation(s)
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
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const n = idx + 1;
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
        <EvaluationForm
          open={formOpen}
          onClose={closeForm}
          item={editItem}
          options={options}
        />
      )}

      {deleteItem && (
        <EvaluationDeleteDialog
          open={!!deleteItem}
          onClose={() => setDeleteItem(null)}
          item={deleteItem}
          onDeleted={() => router.refresh()}
        />
      )}
    </div>
  );
}
