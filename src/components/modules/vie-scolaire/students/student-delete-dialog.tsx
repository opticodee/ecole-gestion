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
import { deleteStudent, type StudentRow } from '@/server/actions/students';

interface StudentDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  student: StudentRow;
  onDeleted?: () => void;
}

export function StudentDeleteDialog({
  open,
  onClose,
  student,
  onDeleted,
}: StudentDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteStudent(student.id);
    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(result.error);
      onClose();
      return;
    }

    toast.success(`Élève ${student.firstName} ${student.lastName} supprimé.`);
    onClose();
    onDeleted?.();
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer l&apos;élève</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer{' '}
            <strong>
              {student.firstName} {student.lastName}
            </strong>{' '}
            ? Les liaisons avec les parents seront retirées et les enregistrements
            d&apos;appel supprimés. Les parents eux-mêmes ne sont pas supprimés.
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
