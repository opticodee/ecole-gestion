'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { HomeworkFilters } from './homework-filters';
import { HomeworkForm } from './homework-form';
import { HomeworkDeleteDialog } from './homework-delete-dialog';
import type { HomeworkRow } from '@/server/actions/homeworks';
import type { CourseContentClassOption } from '@/server/actions/course-contents';
import { formatDateFR } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

interface TeacherOption {
  id: string;
  name: string;
}

interface HomeworkListProps {
  items: HomeworkRow[];
  classes: CourseContentClassOption[];
  teachers: TeacherOption[];
}

type HwStatus = 'A_VENIR' | 'AUJOURD_HUI' | 'EN_RETARD';

function computeStatus(dueISO: string): HwStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueISO);
  due.setHours(0, 0, 0, 0);
  const diff = due.getTime() - today.getTime();
  if (diff < 0) return 'EN_RETARD';
  if (diff === 0) return 'AUJOURD_HUI';
  return 'A_VENIR';
}

function StatusBadge({ status }: { status: HwStatus }) {
  const config: Record<HwStatus, { label: string; cls: string }> = {
    A_VENIR: {
      label: 'À venir',
      cls: 'border-blue-200 bg-blue-100 text-blue-700',
    },
    AUJOURD_HUI: {
      label: "Aujourd'hui",
      cls: 'border-amber-200 bg-amber-100 text-amber-700',
    },
    EN_RETARD: {
      label: 'En retard',
      cls: 'border-red-200 bg-red-100 text-red-700',
    },
  };
  const c = config[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        c.cls,
      )}
    >
      {c.label}
    </span>
  );
}

function truncate(s: string, n: number) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
}

export function HomeworkList({ items, classes, teachers }: HomeworkListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<HomeworkRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<HomeworkRow | null>(null);
  const [viewItem, setViewItem] = useState<HomeworkRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (q) {
        const hay = `${i.title} ${i.description} ${i.classLabel} ${i.teacherName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterClass && i.classGroupId !== filterClass) return false;
      if (filterTeacher && i.teacherId !== filterTeacher) return false;
      if (filterStatus && computeStatus(i.dueDate) !== filterStatus) return false;
      return true;
    });
  }, [items, search, filterClass, filterTeacher, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function openCreate() {
    setEditItem(null);
    setFormOpen(true);
  }

  function openEdit(i: HomeworkRow) {
    setEditItem(i);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditItem(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Devoirs{' '}
          <span className="ml-2 text-base font-normal text-muted-foreground">
            ({filtered.length})
          </span>
        </h1>
        <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4" />
          Nouveau devoir
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher (titre, description, classe, prof)..."
        />
        <HomeworkFilters
          classes={classes}
          teachers={teachers}
          filterClass={filterClass}
          onFilterClass={(v) => {
            setFilterClass(v);
            setPage(1);
          }}
          filterTeacher={filterTeacher}
          onFilterTeacher={(v) => {
            setFilterTeacher(v);
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
        <EmptyState message="Aucun devoir trouvé." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead>Créé le</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Professeur</TableHead>
                  <TableHead>Titre / Résumé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((i) => {
                  const status = computeStatus(i.dueDate);
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {formatDateFR(i.createdDate)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'whitespace-nowrap text-sm font-medium',
                          status === 'EN_RETARD' && 'text-red-600',
                          status === 'AUJOURD_HUI' && 'text-amber-600',
                        )}
                      >
                        {formatDateFR(i.dueDate)}
                      </TableCell>
                      <TableCell className="font-medium">{i.classLabel}</TableCell>
                      <TableCell className="text-xs">{i.teacherName}</TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm font-medium">
                          {i.title || (
                            <span className="text-muted-foreground">
                              (sans titre)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {truncate(i.description, 80)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status} />
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
                            <DropdownMenuItem onClick={() => setViewItem(i)}>
                              <Eye className="h-3.5 w-3.5" />
                              Voir en détail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(i)}>
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteItem(i)}
                            >
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
                Page {currentPage} sur {totalPages} — {filtered.length} devoir(s)
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
        <HomeworkForm
          open={formOpen}
          onClose={() => {
            closeForm();
            router.refresh();
          }}
          item={editItem}
          classes={classes}
        />
      )}

      {deleteItem && (
        <HomeworkDeleteDialog
          open={!!deleteItem}
          onClose={() => setDeleteItem(null)}
          item={deleteItem}
          onDeleted={() => router.refresh()}
        />
      )}

      {viewItem && (
        <Dialog open={!!viewItem} onOpenChange={(v) => !v && setViewItem(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{viewItem.title || 'Devoir'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/30 p-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Créé le
                  </p>
                  <p>{formatDateFR(viewItem.createdDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Échéance
                  </p>
                  <p>{formatDateFR(viewItem.dueDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Classe
                  </p>
                  <p>
                    {viewItem.classLabel} · {viewItem.levelLabel}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Professeur
                  </p>
                  <p>{viewItem.teacherName}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Description
                </p>
                <p className="whitespace-pre-wrap">{viewItem.description}</p>
              </div>
              {viewItem.instructions && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Consignes
                  </p>
                  <p className="whitespace-pre-wrap">{viewItem.instructions}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
