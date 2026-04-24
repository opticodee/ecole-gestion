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
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  createHomework,
  updateHomework,
  type HomeworkRow,
} from '@/server/actions/homeworks';
import type { CourseContentClassOption } from '@/server/actions/course-contents';
import { TIME_SLOT_LABELS } from '@/lib/time-slots';

interface HomeworkFormProps {
  open: boolean;
  onClose: () => void;
  item?: HomeworkRow | null;
  classes: CourseContentClassOption[];
}

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function HomeworkForm({ open, onClose, item, classes }: HomeworkFormProps) {
  const isEdit = !!item;

  const [classGroupId, setClassGroupId] = useState(item?.classGroupId ?? '');
  const [createdDate, setCreatedDate] = useState(
    item ? item.createdDate.slice(0, 10) : todayISO(),
  );
  const [dueDate, setDueDate] = useState(
    item ? item.dueDate.slice(0, 10) : todayISO(),
  );
  const [title, setTitle] = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [instructions, setInstructions] = useState(item?.instructions ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === classGroupId) ?? null,
    [classes, classGroupId],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = {
      classGroupId,
      createdDate,
      dueDate,
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim() || undefined,
    };

    const result = isEdit
      ? await updateHomework(item!.id, data)
      : await createHomework(data);

    setLoading(false);

    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }

    toast.success(isEdit ? 'Devoir modifié.' : 'Devoir créé.');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Modifier le devoir' : 'Nouveau devoir'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Classe</Label>
            <Select
              value={classGroupId}
              onValueChange={(v) => setClassGroupId(v ?? '')}
              items={classes.map((c) => ({
                value: c.id,
                label: `${c.label} — ${c.levelLabel}`,
              }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir une classe..." />
              </SelectTrigger>
              <SelectContent>
                {classes.length === 0 ? (
                  <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                    Aucune classe.
                  </div>
                ) : (
                  classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label} — {c.levelLabel}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedClass && (
            <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Professeur
                </p>
                <p className="mt-0.5 text-sm">
                  {selectedClass.teacherName || (
                    <span className="text-red-600">Non attribué</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Créneau</p>
                <p className="mt-0.5 text-sm">
                  {selectedClass.timeSlot
                    ? TIME_SLOT_LABELS[selectedClass.timeSlot]
                    : '—'}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hw-created">Date de création</Label>
              <Input
                id="hw-created"
                type="date"
                value={createdDate}
                onChange={(e) => setCreatedDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hw-due">Date d&apos;échéance</Label>
              <Input
                id="hw-due"
                type="date"
                value={dueDate}
                min={createdDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hw-title">
              Titre{' '}
              <span className="text-xs text-muted-foreground">(min. 5)</span>
            </Label>
            <Input
              id="hw-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={5}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hw-description">
              Description{' '}
              <span className="text-xs text-muted-foreground">(min. 20)</span>
            </Label>
            <textarea
              id="hw-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={20}
              maxLength={5000}
              rows={5}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hw-instructions">
              Consignes supplémentaires{' '}
              <span className="text-xs text-muted-foreground">(optionnel)</span>
            </Label>
            <textarea
              id="hw-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              maxLength={2000}
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
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
