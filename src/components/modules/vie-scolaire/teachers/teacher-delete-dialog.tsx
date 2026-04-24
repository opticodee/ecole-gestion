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
import { deleteTeacher, type TeacherRow } from '@/server/actions/teachers';

interface Props {
  open: boolean;
  onClose: () => void;
  teacher: TeacherRow;
  onDeleted?: () => void;
}

export function TeacherDeleteDialog({ open, onClose, teacher, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);
  const hasClasses = teacher.classCount > 0;

  async function handleDelete() {
    setLoading(true);
    const result = await deleteTeacher(teacher.id);
    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      `Enseignant ${teacher.firstName} ${teacher.lastName} supprimé.`,
    );
    onClose();
    onDeleted?.();
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer l&apos;enseignant</AlertDialogTitle>
          <AlertDialogDescription>
            {hasClasses ? (
              <>
                <strong>
                  {teacher.firstName} {teacher.lastName}
                </strong>{' '}
                est assigné(e) à {teacher.classCount} classe(s). Réassignez les
                classes à un autre enseignant avant de le/la supprimer.
              </>
            ) : (
              <>
                Êtes-vous sûr de vouloir supprimer{' '}
                <strong>
                  {teacher.firstName} {teacher.lastName}
                </strong>{' '}
                ? Son compte utilisateur et ses liaisons matières seront également
                supprimés. Cette action est irréversible.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>
            {hasClasses ? 'Fermer' : 'Annuler'}
          </Button>
          {!hasClasses && (
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Suppression...' : 'Supprimer'}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
