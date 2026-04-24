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
import { deleteParent, type ParentRow } from '@/server/actions/parents';

interface ParentDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  parent: ParentRow;
  onDeleted?: () => void;
}

export function ParentDeleteDialog({
  open,
  onClose,
  parent,
  onDeleted,
}: ParentDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteParent(parent.id);
    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(result.error);
      onClose();
      return;
    }

    toast.success(`Parent ${parent.firstName} ${parent.lastName} supprimé.`);
    onClose();
    onDeleted?.();
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le parent</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer{' '}
            <strong>
              {parent.firstName} {parent.lastName}
            </strong>{' '}
            ? Les enfants liés ne seront pas supprimés, seules les liaisons et le
            compte utilisateur associé le seront.
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
