'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { deleteEvaluation, type EvaluationRow } from '@/server/actions/evaluations';

interface Props {
  open: boolean;
  onClose: () => void;
  item: EvaluationRow;
  onDeleted?: () => void;
}

export function EvaluationDeleteDialog({ open, onClose, item, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteEvaluation(item.id);
    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(result.error);
      onClose();
      return;
    }

    toast.success(`Évaluation "${item.label}" supprimée.`);
    onClose();
    onDeleted?.();
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer l&apos;évaluation</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer l&apos;évaluation{' '}
            <strong>{item.label}</strong> ?
            {item.gradesCount > 0 && (
              <> Les {item.gradesCount} note(s) associée(s) seront également supprimées.</>
            )}{' '}
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
