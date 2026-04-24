'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
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
import { StudentFilters } from './student-filters';
import { StudentExports } from './student-exports';
import { StudentForm } from './student-form';
import { StudentDeleteDialog } from './student-delete-dialog';
import type { StudentRow } from '@/server/actions/students';
import {
  computeAge,
  formatDateFR,
  GENDER_LABELS_STUDENT,
  STUDENT_STATUS_LABELS,
} from '@/lib/formatters';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 15;

interface ClassOption {
  id: string;
  label: string;
  classGender: string;
  capacity: number;
  studentCount: number;
  levelLabel: string;
}

interface StudentListProps {
  students: StudentRow[];
  classes: ClassOption[];
  levels: { id: string; label: string }[];
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    INSCRIT: 'bg-green-100 text-green-700 border-green-200',
    EN_ATTENTE: 'bg-gray-100 text-gray-700 border-gray-200',
    RADIE: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        variants[status] || '',
      )}
    >
      {STUDENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function GenderBadge({ gender }: { gender: string }) {
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

export function StudentList({ students, classes, levels }: StudentListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<StudentRow | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<StudentRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (q) {
        const full = `${s.firstName} ${s.lastName}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      if (filterClass && s.classGroupId !== filterClass) return false;
      if (filterLevel && s.levelId !== filterLevel) return false;
      if (filterGender && s.gender !== filterGender) return false;
      if (filterStatus && s.status !== filterStatus) return false;
      return true;
    });
  }, [students, search, filterClass, filterLevel, filterGender, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function openCreate() {
    setEditStudent(null);
    setFormOpen(true);
  }

  function openEdit(s: StudentRow) {
    setEditStudent(s);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditStudent(null);
  }

  function contactParents(s: StudentRow) {
    toast.info(`Messagerie bientôt disponible (${s.firstName} ${s.lastName}).`);
  }

  function viewSchedule() {
    toast.info('Emploi du temps bientôt disponible.');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Élèves{' '}
          <span className="ml-2 text-base font-normal text-muted-foreground">
            ({filtered.length})
          </span>
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <StudentExports students={filtered} />
          <Button onClick={openCreate} className="no-print bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4" />
            Ajouter un élève
          </Button>
        </div>
      </div>

      <div className="no-print flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un élève..." />
        <StudentFilters
          classes={classes}
          levels={levels}
          filterClass={filterClass}
          onFilterClass={(v) => {
            setFilterClass(v);
            setPage(1);
          }}
          filterLevel={filterLevel}
          onFilterLevel={(v) => {
            setFilterLevel(v);
            setPage(1);
          }}
          filterGender={filterGender}
          onFilterGender={(v) => {
            setFilterGender(v);
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
        <EmptyState message="Aucun élève trouvé." />
      ) : (
        <>
          <div className="print-container overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead>Genre</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Né(e) le</TableHead>
                  <TableHead className="text-right">Âge</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="no-print w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <GenderBadge gender={s.gender} />
                    </TableCell>
                    <TableCell className="font-medium">{s.lastName}</TableCell>
                    <TableCell>{s.firstName}</TableCell>
                    <TableCell>{formatDateFR(s.dateOfBirth)}</TableCell>
                    <TableCell className="text-right">{computeAge(s.dateOfBirth)} ans</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {s.classLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{s.levelLabel}</TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
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
                          <DropdownMenuItem render={<Link href={`/admin/vie-scolaire/eleves/${s.id}`} />}>
                            Voir la fiche
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={viewSchedule}>
                            Voir l&apos;emploi du temps
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => contactParents(s)}>
                            Contacter les parents
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(s)}>
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteStudent(s)}
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
            <div className="no-print flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} sur {totalPages} — {filtered.length} élève(s)
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
        <StudentForm
          open={formOpen}
          onClose={() => {
            closeForm();
            router.refresh();
          }}
          student={editStudent}
          classes={classes}
        />
      )}

      {deleteStudent && (
        <StudentDeleteDialog
          open={!!deleteStudent}
          onClose={() => setDeleteStudent(null)}
          student={deleteStudent}
          onDeleted={() => router.refresh()}
        />
      )}
    </div>
  );
}
