'use client';

import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateFR } from '@/lib/formatters';

interface Props {
  weekStart: string;
  weekEnd: string;
  onChange: (weekStartISO: string) => void;
}

function addDays(d: Date, days: number): Date {
  const nd = new Date(d);
  nd.setDate(d.getDate() + days);
  return nd;
}

function mondayOfWeek(from: Date): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function TimetableWeekNav({ weekStart, weekEnd, onChange }: Props) {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);
  const now = new Date();
  const currentMonday = mondayOfWeek(now);
  const isCurrentWeek = start.getTime() === currentMonday.getTime();

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onChange(addDays(start, -7).toISOString())}
        title="Semaine précédente"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>
      <div className="rounded-md border bg-background px-3 py-1 text-xs font-medium">
        Semaine du {formatDateFR(start)} au {formatDateFR(end)}
      </div>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onChange(addDays(start, 7).toISOString())}
        title="Semaine suivante"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={isCurrentWeek ? 'secondary' : 'outline'}
        size="sm"
        onClick={() => onChange(currentMonday.toISOString())}
        disabled={isCurrentWeek}
        title="Revenir à la semaine en cours"
      >
        <CalendarDays className="h-3.5 w-3.5" />
        Aujourd&apos;hui
      </Button>
    </div>
  );
}
