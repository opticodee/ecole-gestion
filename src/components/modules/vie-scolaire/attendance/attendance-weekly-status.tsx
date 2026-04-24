'use client';

import { Check, X, Clock, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WeeklyAttendanceStatusRow } from '@/server/actions/attendance';
import { TIME_SLOT_LABELS } from '@/lib/time-slots';
import { formatDateFR } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface AttendanceWeeklyStatusProps {
  rows: WeeklyAttendanceStatusRow[];
  onLaunch: (classGroupId: string, dateISO: string) => void;
}

function StateBadge({ state }: { state: WeeklyAttendanceStatusRow['state'] }) {
  if (state === 'DONE') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
        <Check className="h-3 w-3" />
        Appel fait
      </span>
    );
  }
  if (state === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
        <X className="h-3 w-3" />
        Non fait
      </span>
    );
  }
  if (state === 'UPCOMING') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
        <Clock className="h-3 w-3" />À venir
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
      Libre
    </span>
  );
}

export function AttendanceWeeklyStatus({
  rows,
  onLaunch,
}: AttendanceWeeklyStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appels de la semaine en cours</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="grid min-w-[900px] grid-cols-5 gap-3">
          {rows.map((r) => (
            <div
              key={r.timeSlot}
              className={cn(
                'flex flex-col rounded-lg border p-3',
                r.state === 'DONE'
                  ? 'border-green-200 bg-green-50/40'
                  : r.state === 'PENDING'
                    ? 'border-red-200 bg-red-50/40'
                    : 'bg-muted/20',
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {TIME_SLOT_LABELS[r.timeSlot]}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {formatDateFR(r.date)}
              </p>
              <div className="mt-2 flex-1">
                {r.classLabel ? (
                  <>
                    <p className="truncate font-semibold">{r.classLabel}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.startTime}–{r.endTime} · {r.studentCount} élève(s)
                    </p>
                  </>
                ) : (
                  <p className="text-xs italic text-muted-foreground">
                    Pas de classe assignée
                  </p>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <StateBadge state={r.state} />
                {r.classGroupId && r.state !== 'FREE' && (
                  <Button
                    size="xs"
                    variant={r.state === 'DONE' ? 'outline' : 'default'}
                    onClick={() => onLaunch(r.classGroupId!, r.date)}
                    className={
                      r.state === 'DONE'
                        ? undefined
                        : 'bg-green-600 hover:bg-green-700'
                    }
                  >
                    <ClipboardCheck className="h-3 w-3" />
                    {r.state === 'DONE' ? 'Modifier' : 'Faire'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
