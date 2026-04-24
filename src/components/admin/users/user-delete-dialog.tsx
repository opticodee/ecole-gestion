'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { deleteUser, type UserRow } from '@/server/actions/users';

interface Props {
  open: boolean;
  onClose: () => void;
  user: UserRow;
  onDeleted: () => void;
}

export function UserDeleteDialog({ open, onClose, user, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setError('');
    setLoading(true);
    const result = await deleteUser(user.id);
    setLoading(false);
    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }
    toast.success('Utilisateur supprimé.');
    onDeleted();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer l&apos;utilisateur</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Voulez-vous vraiment supprimer{' '}
            <strong>{user.firstName} {user.lastName}</strong> ? Cette action est
            irréversible.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {loading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
