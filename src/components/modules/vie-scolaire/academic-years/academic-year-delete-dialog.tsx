'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  deleteAcademicYear,
  type AcademicYearRow,
} from '@/server/actions/academic-years';

interface Props {
  open: boolean;
  onClose: () => void;
  year: AcademicYearRow;
  onDeleted: () => void;
}

export function AcademicYearDeleteDialog({
  open,
  onClose,
  year,
  onDeleted,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteAcademicYear(year.id);
    setLoading(false);
    if ('error' in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Année ${year.label} supprimée.`);
    onClose();
    onDeleted();
  }

  const hasData =
    year.stats.classCount > 0 ||
    year.stats.studentCount > 0 ||
    year.stats.evaluationCount > 0 ||
    year.stats.appreciationCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer l&apos;année {year.label}</AlertDialogTitle>
          <AlertDialogDescription>
            {hasData ? (
              <>
                Cette année contient <strong>{year.stats.classCount}</strong>{' '}
                classe(s), <strong>{year.stats.studentCount}</strong> élève(s)
                inscrit(s) et {year.stats.evaluationCount} évaluation(s).
                Supprimez-les d&apos;abord avant de supprimer l&apos;année.
              </>
            ) : (
              <>
                Êtes-vous sûr de vouloir supprimer l&apos;année{' '}
                <strong>{year.label}</strong> ? Cette action est irréversible.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>
            {hasData ? 'Fermer' : 'Annuler'}
          </Button>
          {!hasData && (
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Suppression...' : 'Supprimer'}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
