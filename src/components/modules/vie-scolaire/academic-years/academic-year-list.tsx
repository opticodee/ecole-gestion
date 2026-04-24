'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AcademicYearRow } from '@/server/actions/academic-years';
import { AcademicYearCard } from './academic-year-card';
import { AcademicYearForm } from './academic-year-form';
import { AcademicYearActivateDialog } from './academic-year-activate-dialog';
import { AcademicYearCloseDialog } from './academic-year-close-dialog';
import { AcademicYearDeleteDialog } from './academic-year-delete-dialog';

interface Props {
  years: AcademicYearRow[];
}

export function AcademicYearList({ years }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editYear, setEditYear] = useState<AcademicYearRow | null>(null);
  const [activateTarget, setActivateTarget] = useState<AcademicYearRow | null>(null);
  const [closeTarget, setCloseTarget] = useState<AcademicYearRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AcademicYearRow | null>(null);

  function openCreate() {
    setEditYear(null);
    setFormOpen(true);
  }

  function openEdit(y: AcademicYearRow) {
    setEditYear(y);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditYear(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            Année scolaire{' '}
            <span className="ml-1 text-base font-normal text-muted-foreground">
              ({years.length})
            </span>
          </h1>
        </div>
        <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4" />
          Créer une nouvelle année
        </Button>
      </div>

      {years.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 py-16 text-center text-sm text-muted-foreground">
          Aucune année scolaire enregistrée. Cliquez sur « Créer une nouvelle année ».
        </div>
      ) : (
        <div className="space-y-3">
          {years.map((y) => (
            <AcademicYearCard
              key={y.id}
              year={y}
              onEdit={() => openEdit(y)}
              onActivate={() => setActivateTarget(y)}
              onClose={() => setCloseTarget(y)}
              onDelete={() => setDeleteTarget(y)}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <AcademicYearForm open={formOpen} onClose={closeForm} year={editYear} />
      )}

      {activateTarget && (
        <AcademicYearActivateDialog
          open={!!activateTarget}
          onClose={() => setActivateTarget(null)}
          year={activateTarget}
          activeYear={years.find((y) => y.status === 'ACTIVE') ?? null}
          onActivated={() => router.refresh()}
        />
      )}

      {closeTarget && (
        <AcademicYearCloseDialog
          open={!!closeTarget}
          onClose={() => setCloseTarget(null)}
          year={closeTarget}
          onClosed={() => router.refresh()}
        />
      )}

      {deleteTarget && (
        <AcademicYearDeleteDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          year={deleteTarget}
          onDeleted={() => router.refresh()}
        />
      )}
    </div>
  );
}
