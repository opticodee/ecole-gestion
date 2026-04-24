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
import {
  deleteCourseContent,
  type CourseContentRow,
} from '@/server/actions/course-contents';

interface CourseContentDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  item: CourseContentRow;
  onDeleted?: () => void;
}

export function CourseContentDeleteDialog({
  open,
  onClose,
  item,
  onDeleted,
}: CourseContentDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteCourseContent(item.id);
    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(result.error);
      onClose();
      return;
    }

    toast.success('Contenu supprimé.');
    onClose();
    onDeleted?.();
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le contenu de cours</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer le contenu{' '}
            <strong>{item.title || '(sans titre)'}</strong> ? Cette action est
            irréversible.
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
