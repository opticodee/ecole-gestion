'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  getClassForAttendance,
  getAttendanceByClassAndDate,
  saveAttendance,
  type ClassForAttendance,
} from '@/server/actions/attendance';
import { TIME_SLOT_LABELS } from '@/lib/time-slots';
import { formatDateFR } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type Status = 'PRESENT' | 'ABSENT' | 'RETARD';

interface EntryState {
  status: Status;
  lateMinutes: number;
}

interface AttendanceModalProps {
  open: boolean;
  onClose: () => void;
  classGroupId: string;
  dateISO?: string;
}

export function AttendanceModal({
  open,
  onClose,
  classGroupId,
  dateISO,
}: AttendanceModalProps) {
  const router = useRouter();
  const [classData, setClassData] = useState<ClassForAttendance | null>(null);
  const [entries, setEntries] = useState<Record<string, EntryState>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  const date = useMemo(() => {
    const d = dateISO ? new Date(dateISO) : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [dateISO]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await getClassForAttendance(classGroupId);
      if (cancelled || !data) {
        if (!cancelled) toast.error('Classe introuvable.');
        setLoading(false);
        return;
      }
      setClassData(data);

      const existing = data.schedule
        ? await getAttendanceByClassAndDate(
            classGroupId,
            data.schedule.id,
            date.toISOString(),
          )
        : [];
      if (cancelled) return;

      const init: Record<string, EntryState> = {};
      for (const s of data.students) {
        const rec = existing.find((r) => r.studentId === s.id);
        if (rec) {
          const status: Status =
            rec.status === 'RETARD'
              ? 'RETARD'
              : rec.status === 'ABSENT'
                ? 'ABSENT'
                : 'PRESENT';
          const match = rec.reason?.match(/Retard de (\d+) min/);
          init[s.id] = {
            status,
            lateMinutes: match ? parseInt(match[1]) : status === 'RETARD' ? 5 : 0,
          };
        } else {
          init[s.id] = { status: 'PRESENT', lateMinutes: 0 };
        }
      }
      setEntries(init);
      setIsUpdate(existing.length > 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, classGroupId, date]);

  function setStatus(studentId: string, status: Status) {
    setEntries((prev) => ({
      ...prev,
      [studentId]: {
        status,
        lateMinutes: status === 'RETARD' ? prev[studentId]?.lateMinutes || 5 : 0,
      },
    }));
  }

  function setLateMinutes(studentId: string, minutes: number) {
    setEntries((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], lateMinutes: minutes },
    }));
  }

  const stats = useMemo(() => {
    let p = 0,
      a = 0,
      r = 0;
    for (const e of Object.values(entries)) {
      if (e.status === 'PRESENT') p++;
      else if (e.status === 'ABSENT') a++;
      else r++;
    }
    return { p, a, r };
  }, [entries]);

  async function handleSubmit() {
    if (!classData?.schedule) return;
    setSaving(true);

    const payload = {
      classGroupId: classData.id,
      scheduleId: classData.schedule.id,
      date: date.toISOString(),
      entries: classData.students.map((s) => ({
        studentId: s.id,
        status: entries[s.id]?.status ?? 'PRESENT',
        lateMinutes: entries[s.id]?.lateMinutes ?? 0,
      })),
    };

    const result = await saveAttendance(payload);
    setSaving(false);

    if ('error' in result && result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Appel enregistré pour la classe ${classData.label}.`);
    router.refresh();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-green-600" />
            {isUpdate ? "Modifier l'appel" : "Faire l'appel"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !classData ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Classe introuvable.
          </p>
        ) : !classData.schedule ? (
          <p className="py-8 text-center text-sm text-red-600">
            Aucun créneau défini pour cette classe.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Classe</p>
                <p className="font-medium">{classData.label}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Professeur</p>
                <p className="font-medium">
                  {classData.teacherName || (
                    <span className="text-red-600">—</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Créneau</p>
                <p className="font-medium">
                  {TIME_SLOT_LABELS[classData.schedule.timeSlot]}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{formatDateFR(date)}</p>
              </div>
            </div>

            <div className="flex gap-3 text-xs">
              <span className="rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-green-700">
                {stats.p} présent(s)
              </span>
              <span className="rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-red-700">
                {stats.a} absent(s)
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-amber-700">
                {stats.r} retard(s)
              </span>
            </div>

            {classData.students.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucun élève inscrit dans cette classe.
              </p>
            ) : (
              <div className="max-h-[50vh] space-y-1 overflow-y-auto">
                {classData.students.map((s) => {
                  const entry = entries[s.id];
                  return (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {s.lastName} {s.firstName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.matricule}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {(['PRESENT', 'ABSENT', 'RETARD'] as Status[]).map(
                          (st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setStatus(s.id, st)}
                              className={cn(
                                'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                                entry?.status === st
                                  ? st === 'PRESENT'
                                    ? 'border-green-500 bg-green-500 text-white'
                                    : st === 'ABSENT'
                                      ? 'border-red-500 bg-red-500 text-white'
                                      : 'border-amber-500 bg-amber-500 text-white'
                                  : 'border-input bg-background hover:bg-muted',
                              )}
                            >
                              {st === 'PRESENT'
                                ? 'P'
                                : st === 'ABSENT'
                                  ? 'A'
                                  : 'R'}
                            </button>
                          ),
                        )}
                        {entry?.status === 'RETARD' && (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min={1}
                              max={240}
                              value={entry.lateMinutes || ''}
                              onChange={(e) =>
                                setLateMinutes(
                                  s.id,
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="w-16 h-8 text-xs"
                            />
                            <span className="text-xs text-muted-foreground">
                              min
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              Un retard supérieur à 15 minutes est automatiquement enregistré
              comme absence.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving || classData.students.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving
                  ? 'Enregistrement...'
                  : isUpdate
                    ? "Mettre à jour l'appel"
                    : "Enregistrer l'appel"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
