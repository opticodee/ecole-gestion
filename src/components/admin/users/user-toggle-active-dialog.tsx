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
import { toggleUserActive, type UserRow } from '@/server/actions/users';

interface Props {
  open: boolean;
  onClose: () => void;
  user: UserRow;
  onDone: () => void;
}

export function UserToggleActiveDialog({ open, onClose, user, onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const willDeactivate = user.isActive;

  async function handleConfirm() {
    setError('');
    setLoading(true);
    const result = await toggleUserActive(user.id);
    setLoading(false);
    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }
    toast.success(
      willDeactivate ? 'Utilisateur désactivé.' : 'Utilisateur activé.',
    );
    onDone();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {willDeactivate ? 'Désactiver l\'utilisateur' : 'Activer l\'utilisateur'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {willDeactivate ? (
              <>
                L&apos;utilisateur <strong>{user.firstName} {user.lastName}</strong> ne
                pourra plus se connecter. Vous pourrez le réactiver plus tard.
              </>
            ) : (
              <>
                Réactiver le compte de{' '}
                <strong>{user.firstName} {user.lastName}</strong> ? Il pourra à nouveau se
                connecter.
              </>
            )}
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
              className={
                willDeactivate
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-green-600 hover:bg-green-700'
              }
            >
              {loading
                ? '...'
                : willDeactivate
                  ? 'Désactiver'
                  : 'Activer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
