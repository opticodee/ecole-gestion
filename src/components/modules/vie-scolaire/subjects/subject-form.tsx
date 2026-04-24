'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toSelectItems,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createSubject, updateSubject, type SubjectRow } from '@/server/actions/subjects';

const NO_PARENT = '__none__';

interface SubjectFormProps {
  open: boolean;
  onClose: () => void;
  subject?: SubjectRow | null;
  subjects: SubjectRow[];
  defaultParentId?: string | null;
}

export function SubjectForm({ open, onClose, subject, subjects, defaultParentId }: SubjectFormProps) {
  const [label, setLabel] = useState(subject?.label ?? '');
  const [weeklyHours, setWeeklyHours] = useState(subject?.weeklyHours?.toString() ?? '1');
  const [parentId, setParentId] = useState<string>(
    subject?.parentId ?? defaultParentId ?? NO_PARENT,
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEdit = !!subject;

  const availableParents = useMemo(() => {
    // Seules les matières de premier niveau peuvent servir de parent.
    // En édition, on empêche une matière d'être son propre parent et
    // on masque les matières qui sont déjà des sous-matières.
    const topLevel = subjects.filter((s) => s.parentId === null);
    if (!isEdit) return topLevel;
    return topLevel.filter((s) => s.id !== subject!.id);
  }, [subjects, isEdit, subject]);

  // Si la matière a des enfants, on ne peut pas lui assigner un parent
  const canHaveParent = !isEdit || (subject?.childrenCount ?? 0) === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = {
      label: label.trim(),
      weeklyHours: Number(weeklyHours),
      parentId: parentId === NO_PARENT ? null : parentId,
    };
    const result = isEdit
      ? await updateSubject(subject!.id, data)
      : await createSubject(data);

    setLoading(false);

    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }

    toast.success(isEdit ? 'Matière modifiée avec succès.' : 'Matière créée avec succès.');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier la matière' : 'Ajouter une matière'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject-label">Libellé</Label>
            <Input
              id="subject-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: Coran, Lecture, Grammaire..."
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject-parent">Matière parente (optionnel)</Label>
            <Select
              value={parentId}
              onValueChange={(v) => setParentId(v ?? NO_PARENT)}
              disabled={!canHaveParent}
              items={[
                { value: NO_PARENT, label: 'Aucune (matière de premier niveau)' },
                ...toSelectItems(availableParents, 'id', 'label'),
              ]}
            >
              <SelectTrigger id="subject-parent">
                <SelectValue placeholder="Aucune (matière de premier niveau)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PARENT}>Aucune (matière de premier niveau)</SelectItem>
                {availableParents.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!canHaveParent && (
              <p className="text-xs text-muted-foreground">
                Cette matière contient des sous-matières, elle doit rester de premier niveau.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject-hours">Heures à planifier (par semaine)</Label>
            <Input
              id="subject-hours"
              type="number"
              min={0.5}
              step={0.5}
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(e.target.value)}
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
