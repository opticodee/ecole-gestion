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
import { CourseContentFilters } from './course-content-filters';
import { CourseContentForm } from './course-content-form';
import { CourseContentDeleteDialog } from './course-content-delete-dialog';
import type {
  CourseContentRow,
  CourseContentClassOption,
} from '@/server/actions/course-contents';
import { formatDateFR } from '@/lib/formatters';
import { TIME_SLOT_LABELS } from '@/lib/time-slots';

const PAGE_SIZE = 10;

interface TeacherOption {
  id: string;
  name: string;
}

interface CourseContentListProps {
  items: CourseContentRow[];
  classes: CourseContentClassOption[];
  teachers: TeacherOption[];
}

function truncate(s: string, n: number) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
}

export function CourseContentList({
  items,
  classes,
  teachers,
}: CourseContentListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<CourseContentRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<CourseContentRow | null>(null);
  const [viewItem, setViewItem] = useState<CourseContentRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    const cutoff = filterPeriod
      ? new Date(now.getTime() - parseInt(filterPeriod) * 86400000)
      : null;

    return items.filter((i) => {
      if (q) {
        const hay = `${i.title} ${i.content} ${i.classLabel} ${i.teacherName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterClass && i.classGroupId !== filterClass) return false;
      if (filterTeacher && i.teacherId !== filterTeacher) return false;
      if (cutoff && new Date(i.date).getTime() < cutoff.getTime()) return false;
      return true;
    });
  }, [items, search, filterClass, filterTeacher, filterPeriod]);

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

  function openEdit(i: CourseContentRow) {
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
          Contenu de cours{' '}
          <span className="ml-2 text-base font-normal text-muted-foreground">
            ({filtered.length})
          </span>
        </h1>
        <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4" />
          Nouveau contenu
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher (titre, contenu, classe, prof)..."
        />
        <CourseContentFilters
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
          filterPeriod={filterPeriod}
          onFilterPeriod={(v) => {
            setFilterPeriod(v);
            setPage(1);
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="Aucun contenu trouvé." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead>Date</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Professeur</TableHead>
                  <TableHead>Créneau</TableHead>
                  <TableHead>Titre / Résumé</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateFR(i.date)}
                    </TableCell>
                    <TableCell className="font-medium">{i.classLabel}</TableCell>
                    <TableCell className="text-xs">{i.teacherName}</TableCell>
                    <TableCell className="text-xs">
                      {i.timeSlot ? TIME_SLOT_LABELS[i.timeSlot] : '—'}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm font-medium">
                        {i.title || (
                          <span className="text-muted-foreground">
                            (sans titre)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {truncate(i.content, 80)}
                      </p>
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
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} sur {totalPages} — {filtered.length} entrée(s)
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
        <CourseContentForm
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
        <CourseContentDeleteDialog
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
              <DialogTitle>
                {viewItem.title || 'Contenu de cours'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/30 p-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Date
                  </p>
                  <p>{formatDateFR(viewItem.date)}</p>
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
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Créneau
                  </p>
                  <p>
                    {viewItem.timeSlot
                      ? TIME_SLOT_LABELS[viewItem.timeSlot]
                      : '—'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Contenu
                </p>
                <p className="whitespace-pre-wrap">{viewItem.content}</p>
              </div>
              {viewItem.objectives && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Objectifs
                  </p>
                  <p className="whitespace-pre-wrap">{viewItem.objectives}</p>
                </div>
              )}
              {viewItem.remarks && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Remarques
                  </p>
                  <p className="whitespace-pre-wrap">{viewItem.remarks}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
