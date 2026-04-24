'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createLevel, updateLevel, type LevelRow } from '@/server/actions/levels';

interface LevelFormProps {
  open: boolean;
  onClose: () => void;
  level?: LevelRow | null;
}

export function LevelForm({ open, onClose, level }: LevelFormProps) {
  const [label, setLabel] = useState(level?.label ?? '');
  const [capacity, setCapacity] = useState(level?.totalCapacity?.toString() ?? '30');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEdit = !!level;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = { label: label.trim(), capacity: Number(capacity) };
    const result = isEdit
      ? await updateLevel(level!.id, data)
      : await createLevel(data);

    setLoading(false);

    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }

    toast.success(isEdit ? 'Niveau modifié avec succès.' : 'Niveau créé avec succès.');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier le niveau' : 'Ajouter un niveau'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="level-label">Libellé</Label>
            <Input
              id="level-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: Coran Niveau 1"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="level-capacity">Nombre de places</Label>
            <Input
              id="level-capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
