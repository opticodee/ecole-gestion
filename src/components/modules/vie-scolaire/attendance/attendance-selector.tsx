'use client';

import { useMemo, useState } from 'react';
import { ClipboardCheck, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AttendanceModal } from './attendance-modal';
import type { AttendanceClassOption } from '@/server/actions/attendance';
import { TIME_SLOT_LABELS } from '@/lib/time-slots';

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

interface AttendanceSelectorProps {
  classes: AttendanceClassOption[];
  onOpenModal: (classGroupId: string, dateISO: string) => void;
}

export function AttendanceSelector({
  classes,
  onOpenModal,
}: AttendanceSelectorProps) {
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(todayISO());

  const selected = useMemo(
    () => classes.find((c) => c.id === classId) ?? null,
    [classes, classId],
  );

  function launch() {
    if (!classId) return;
    onOpenModal(classId, new Date(date).toISOString());
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-green-600" />
          Faire l&apos;appel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Classe</Label>
            <Select
              value={classId}
              onValueChange={(v) => setClassId(v ?? '')}
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
          <div className="space-y-2">
            <Label htmlFor="appel-date">Date de l&apos;appel</Label>
            <Input
              id="appel-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {selected && (
          <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Professeur</p>
              <p className="font-medium">
                {selected.teacherName || (
                  <span className="text-red-600">Non attribué</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Créneau</p>
              <p className="flex items-center gap-1 font-medium">
                <Calendar className="h-3 w-3" />
                {selected.timeSlot
                  ? `${TIME_SLOT_LABELS[selected.timeSlot]} · ${selected.startTime}–${selected.endTime}`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Élèves inscrits</p>
              <p className="flex items-center gap-1 font-medium">
                <Users className="h-3 w-3" />
                {selected.studentCount ?? '—'}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={launch}
            disabled={!classId || !selected?.teacherName || !selected.timeSlot}
            className="bg-green-600 hover:bg-green-700"
          >
            <ClipboardCheck className="h-4 w-4" />
            Lancer l&apos;appel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { AttendanceModal };
