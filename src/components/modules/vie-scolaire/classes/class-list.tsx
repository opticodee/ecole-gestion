'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
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
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { ClassForm } from './class-form';
import { ClassDeleteDialog } from './class-delete-dialog';
import { ClassFilters } from './class-filters';
import type { ClassRow } from '@/server/actions/classes';
import { TIME_SLOT_LABELS, GENDER_LABELS, PERIOD_LABELS } from '@/lib/time-slots';
import { cn } from '@/lib/utils';

function FillBar({ rate }: { rate: number }) {
  const color =
    rate > 95 ? 'bg-red-500' : rate >= 80 ? 'bg-orange-400' : 'bg-primary';

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-muted">
        <div
          className={cn('h-2 rounded-full transition-all', color)}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{rate}%</span>
    </div>
  );
}

function GenderBadge({ gender }: { gender: string }) {
  const variants: Record<string, string> = {
    FILLE: 'bg-pink-100 text-pink-700 border-pink-200',
    GARCON: 'bg-blue-100 text-blue-700 border-blue-200',
    MIXTE: 'bg-violet-100 text-violet-700 border-violet-200',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', variants[gender] || '')}>
      {GENDER_LABELS[gender] || gender}
    </span>
  );
}

interface ClassListProps {
  classes: ClassRow[];
  teachers: { id: string; name: string }[];
  levels: { id: string; label: string }[];
}

export function ClassList({ classes, teachers, levels }: ClassListProps) {
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editClass, setEditClass] = useState<ClassRow | null>(null);
  const [deleteClass, setDeleteClass] = useState<ClassRow | null>(null);

  const filtered = classes.filter((c) => {
    if (search && !c.label.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterLevel && c.levelId !== filterLevel) return false;
    if (filterGender && c.classGender !== filterGender) return false;
    return true;
  });

  function openCreate() {
    setEditClass(null);
    setFormOpen(true);
  }

  function openEdit(cls: ClassRow) {
    setEditClass(cls);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditClass(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Classes" actionLabel="Ajouter une classe" onAction={openCreate} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une classe..." />
        <ClassFilters
          levels={levels}
          filterLevel={filterLevel}
          onFilterLevel={setFilterLevel}
          filterGender={filterGender}
          onFilterGender={setFilterGender}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="Aucune classe trouvée." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead>Libellé</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>Professeur</TableHead>
                <TableHead>Créneau</TableHead>
                <TableHead>Période</TableHead>
                <TableHead className="text-right">Places</TableHead>
                <TableHead className="text-right">Inscrits</TableHead>
                <TableHead>Remplissage</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">{cls.label}</TableCell>
                  <TableCell>{cls.levelLabel}</TableCell>
                  <TableCell>
                    <GenderBadge gender={cls.classGender} />
                  </TableCell>
                  <TableCell>
                    {cls.teacherName && cls.teacherId ? (
                      <Link
                        href={`/admin/vie-scolaire/enseignants/${cls.teacherId}`}
                        className="no-underline"
                      >
                        <Badge
                          variant="secondary"
                          className="cursor-pointer text-xs hover:bg-primary/10"
                        >
                          {cls.teacherName}
                        </Badge>
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">Non assigné</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {cls.schedule ? (
                      <span className="text-sm">
                        {TIME_SLOT_LABELS[cls.schedule.timeSlot] || cls.schedule.timeSlot}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {cls.schedule.startTime} - {cls.schedule.endTime}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Non planifié</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{PERIOD_LABELS[cls.periodType] || cls.periodType}</TableCell>
                  <TableCell className="text-right">{cls.capacity}</TableCell>
                  <TableCell className="text-right">{cls.studentCount}</TableCell>
                  <TableCell>
                    <FillBar rate={cls.fillRate} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(cls)}
                        title="Modifier"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteClass(cls)}
                        title="Supprimer"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {formOpen && (
        <ClassForm
          open={formOpen}
          onClose={closeForm}
          classRow={editClass}
          teachers={teachers}
          levels={levels}
        />
      )}

      {deleteClass && (
        <ClassDeleteDialog
          open={!!deleteClass}
          onClose={() => setDeleteClass(null)}
          classRow={deleteClass}
        />
      )}
    </div>
  );
}
