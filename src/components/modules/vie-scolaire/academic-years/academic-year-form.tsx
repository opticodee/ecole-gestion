'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createAcademicYear,
  updateAcademicYear,
  type AcademicYearRow,
} from '@/server/actions/academic-years';

interface Props {
  open: boolean;
  onClose: () => void;
  year?: AcademicYearRow | null;
}

function toInput(d: string | null): string {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

function defaultFromStart(startISO: string) {
  if (!startISO) return null;
  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) return null;
  const y1 = start.getFullYear();
  const y2 = y1 + 1;
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    label: `${y1}-${y2}`,
    endDate: iso(new Date(y2, 5, 30)),
    t1Start: iso(new Date(y1, 8, 1)),
    t1End: iso(new Date(y1, 11, 20)),
    t2Start: iso(new Date(y2, 0, 5)),
    t2End: iso(new Date(y2, 2, 28)),
    t3Start: iso(new Date(y2, 3, 6)),
    t3End: iso(new Date(y2, 5, 30)),
  };
}

export function AcademicYearForm({ open, onClose, year }: Props) {
  const isEdit = !!year;
  const [label, setLabel] = useState(year?.label ?? '');
  const [startDate, setStartDate] = useState(toInput(year?.startDate ?? null));
  const [endDate, setEndDate] = useState(toInput(year?.endDate ?? null));
  const [t1Start, setT1Start] = useState(toInput(year?.trimestre1Start ?? null));
  const [t1End, setT1End] = useState(toInput(year?.trimestre1End ?? null));
  const [t2Start, setT2Start] = useState(toInput(year?.trimestre2Start ?? null));
  const [t2End, setT2End] = useState(toInput(year?.trimestre2End ?? null));
  const [t3Start, setT3Start] = useState(toInput(year?.trimestre3Start ?? null));
  const [t3End, setT3End] = useState(toInput(year?.trimestre3End ?? null));
  const [userTouchedLabel, setUserTouchedLabel] = useState(!!year);
  const [userTouchedEnd, setUserTouchedEnd] = useState(!!year);
  const [userTouchedTrimesters, setUserTouchedTrimesters] = useState(!!year);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Smart pre-fill when startDate changes (only if user hasn't overridden)
  useEffect(() => {
    if (!startDate) return;
    const defaults = defaultFromStart(startDate);
    if (!defaults) return;
    if (!userTouchedLabel) setLabel(defaults.label);
    if (!userTouchedEnd) setEndDate(defaults.endDate);
    if (!userTouchedTrimesters) {
      setT1Start(defaults.t1Start);
      setT1End(defaults.t1End);
      setT2Start(defaults.t2Start);
      setT2End(defaults.t2End);
      setT3Start(defaults.t3Start);
      setT3End(defaults.t3End);
    }
  }, [startDate, userTouchedLabel, userTouchedEnd, userTouchedTrimesters]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      label: label.trim(),
      startDate,
      endDate,
      trimestre1Start: t1Start,
      trimestre1End: t1End,
      trimestre2Start: t2Start,
      trimestre2End: t2End,
      trimestre3Start: t3Start,
      trimestre3End: t3End,
    };

    const result = isEdit
      ? await updateAcademicYear(year!.id, payload)
      : await createAcademicYear(payload);
    setLoading(false);

    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }

    toast.success(isEdit ? 'Année modifiée.' : 'Année créée en brouillon.');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'année scolaire" : 'Créer une nouvelle année scolaire'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ay-start">Date de début</Label>
              <Input
                id="ay-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                autoFocus={!isEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ay-end">Date de fin</Label>
              <Input
                id="ay-end"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setUserTouchedEnd(true);
                  setEndDate(e.target.value);
                }}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ay-label">Libellé</Label>
            <Input
              id="ay-label"
              value={label}
              onChange={(e) => {
                setUserTouchedLabel(true);
                setLabel(e.target.value);
              }}
              required
              placeholder="ex: 2026-2027"
            />
            <p className="text-[10px] text-muted-foreground">
              Auto-généré à partir de la date de début si laissé vide.
            </p>
          </div>

          <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Trimestres
              {!isEdit && startDate && !userTouchedTrimesters && (
                <span className="font-normal normal-case text-[10px] text-muted-foreground/80">
                  pré-remplis automatiquement
                </span>
              )}
            </div>

            {[
              {
                idx: 1,
                start: t1Start,
                setStart: setT1Start,
                end: t1End,
                setEnd: setT1End,
              },
              {
                idx: 2,
                start: t2Start,
                setStart: setT2Start,
                end: t2End,
                setEnd: setT2End,
              },
              {
                idx: 3,
                start: t3Start,
                setStart: setT3Start,
                end: t3End,
                setEnd: setT3End,
              },
            ].map((t) => (
              <div key={t.idx} className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-end">
                <div className="space-y-1 sm:col-span-1">
                  <Label className="text-xs">Trimestre {t.idx}</Label>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Début</Label>
                  <Input
                    type="date"
                    value={t.start}
                    onChange={(e) => {
                      setUserTouchedTrimesters(true);
                      t.setStart(e.target.value);
                    }}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Fin</Label>
                  <Input
                    type="date"
                    value={t.end}
                    onChange={(e) => {
                      setUserTouchedTrimesters(true);
                      t.setEnd(e.target.value);
                    }}
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? 'Enregistrement...'
                : isEdit
                  ? 'Enregistrer les modifications'
                  : 'Créer en brouillon'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
