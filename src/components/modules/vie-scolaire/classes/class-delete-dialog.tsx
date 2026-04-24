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
import { deleteClass, type ClassRow } from '@/server/actions/classes';

interface ClassDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  classRow: ClassRow;
}

export function ClassDeleteDialog({ open, onClose, classRow }: ClassDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteClass(classRow.id);
    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(result.error);
      onClose();
      return;
    }

    toast.success(`Classe "${classRow.label}" supprimée.`);
    onClose();
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer la classe</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer la classe <strong>{classRow.label}</strong> ?
            Cette action est irréversible et supprimera aussi le créneau associé.
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
