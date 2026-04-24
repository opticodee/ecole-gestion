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
import { deleteSubject, type SubjectRow } from '@/server/actions/subjects';

interface SubjectDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  subject: SubjectRow;
}

export function SubjectDeleteDialog({ open, onClose, subject }: SubjectDeleteDialogProps) {
  const [loading, setLoading] = useState(false);
  const hasChildren = subject.childrenCount > 0;

  async function handleDelete() {
    setLoading(true);
    const result = await deleteSubject(subject.id);
    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(result.error);
      onClose();
      return;
    }

    toast.success(`Matière "${subject.label}" supprimée.`);
    onClose();
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer la matière</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer la matière <strong>{subject.label}</strong> ?
            Cette action est irréversible.
          </AlertDialogDescription>
          {hasChildren && (
            <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-900">
              ⚠️ Cette matière contient <strong>{subject.childrenCount}</strong>{' '}
              sous-matière{subject.childrenCount > 1 ? 's' : ''} qui ser
              {subject.childrenCount > 1 ? 'ont' : 'a'} également supprimée
              {subject.childrenCount > 1 ? 's' : ''}.
            </p>
          )}
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
