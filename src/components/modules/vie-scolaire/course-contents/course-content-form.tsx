'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
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
  createCourseContent,
  updateCourseContent,
  type CourseContentRow,
  type CourseContentClassOption,
} from '@/server/actions/course-contents';
import { TIME_SLOT_LABELS } from '@/lib/time-slots';

interface CourseContentFormProps {
  open: boolean;
  onClose: () => void;
  item?: CourseContentRow | null;
  classes: CourseContentClassOption[];
}

const TIME_SLOT_TO_WEEKDAY: Record<string, number> = {
  MERCREDI_PM: 3,
  SAMEDI_AM: 6,
  SAMEDI_PM: 6,
  DIMANCHE_AM: 0,
  DIMANCHE_PM: 0,
};

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function CourseContentForm({
  open,
  onClose,
  item,
  classes,
}: CourseContentFormProps) {
  const isEdit = !!item;

  const [classGroupId, setClassGroupId] = useState(item?.classGroupId ?? '');
  const [date, setDate] = useState(item ? item.date.slice(0, 10) : todayISO());
  const [title, setTitle] = useState(item?.title ?? '');
  const [content, setContent] = useState(item?.content ?? '');
  const [objectives, setObjectives] = useState(item?.objectives ?? '');
  const [remarks, setRemarks] = useState(item?.remarks ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === classGroupId) ?? null,
    [classes, classGroupId],
  );

  const dayMismatch = useMemo(() => {
    if (!selectedClass?.timeSlot || !date) return false;
    const expected = TIME_SLOT_TO_WEEKDAY[selectedClass.timeSlot];
    if (expected == null) return false;
    const d = new Date(date + 'T12:00:00');
    return d.getDay() !== expected;
  }, [selectedClass, date]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = {
      classGroupId,
      date,
      title: title.trim(),
      content: content.trim(),
      objectives: objectives.trim() || undefined,
      remarks: remarks.trim() || undefined,
    };

    const result = isEdit
      ? await updateCourseContent(item!.id, data)
      : await createCourseContent(data);

    setLoading(false);

    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }

    toast.success(isEdit ? 'Contenu modifié.' : 'Contenu enregistré.');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Modifier le contenu de cours' : 'Nouveau contenu de cours'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cc-date">Date du cours</Label>
              <Input
                id="cc-date"
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
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
                    ? `${TIME_SLOT_LABELS[selectedClass.timeSlot]} · ${selectedClass.startTime}–${selectedClass.endTime}`
                    : '—'}
                </p>
              </div>
            </div>
          )}

          {dayMismatch && (
            <div className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 p-2.5 text-xs text-orange-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                La date sélectionnée ne correspond pas au créneau habituel de la
                classe. Enregistrement possible (exceptionnel).
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cc-title">
              Titre / Sujet{' '}
              <span className="text-xs text-muted-foreground">(min. 5)</span>
            </Label>
            <Input
              id="cc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={5}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc-content">
              Contenu détaillé{' '}
              <span className="text-xs text-muted-foreground">(min. 20)</span>
            </Label>
            <textarea
              id="cc-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              minLength={20}
              maxLength={5000}
              rows={5}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cc-objectives">
                Objectifs{' '}
                <span className="text-xs text-muted-foreground">(optionnel)</span>
              </Label>
              <textarea
                id="cc-objectives"
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                maxLength={2000}
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-remarks">
                Remarques{' '}
                <span className="text-xs text-muted-foreground">(optionnel)</span>
              </Label>
              <textarea
                id="cc-remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                maxLength={2000}
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </div>
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
