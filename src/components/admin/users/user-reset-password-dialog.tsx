'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { resetUserPassword, type UserRow } from '@/server/actions/users';

interface Props {
  open: boolean;
  onClose: () => void;
  user: UserRow;
}

export function UserResetPasswordDialog({ open, onClose, user }: Props) {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleReset() {
    setError('');
    setLoading(true);
    const result = await resetUserPassword(user.id);
    setLoading(false);
    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }
    if ('password' in result && result.password) {
      setNewPassword(result.password);
    }
  }

  async function copyPassword(pwd: string) {
    try {
      await navigator.clipboard.writeText(pwd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Impossible de copier dans le presse-papiers.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {newPassword ? 'Nouveau mot de passe' : 'Réinitialiser le mot de passe'}
          </DialogTitle>
        </DialogHeader>

        {newPassword ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Un nouveau mot de passe temporaire a été généré pour{' '}
              <strong>
                {user.firstName} {user.lastName}
              </strong>
              . Communiquez-le à l&apos;utilisateur.{' '}
              <strong>Ce mot de passe ne sera affiché qu&apos;une seule fois.</strong>
            </p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
              <code className="flex-1 font-mono text-sm">{newPassword}</code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyPassword(newPassword)}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copié
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copier
                  </>
                )}
              </Button>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={onClose}>
                Terminé
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Réinitialiser le mot de passe de{' '}
              <strong>
                {user.firstName} {user.lastName}
              </strong>{' '}
              ? Un nouveau mot de passe temporaire sera généré.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="button" onClick={handleReset} disabled={loading}>
                {loading ? 'Génération...' : 'Réinitialiser'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
