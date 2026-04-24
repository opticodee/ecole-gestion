'use client';

import { useState, useTransition } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getTimetableData,
  type TimetableClassCell,
  type TimetableData,
} from '@/server/actions/timetable';
import { TimetableFilters, type ViewMode } from './timetable-filters';
import { TimetableWeekNav } from './timetable-week-nav';
import { TimetableGrid } from './timetable-grid';
import { TimetableSummary } from './timetable-summary';
import { TimetableExports } from './timetable-exports';
import { TimetableDetailModal } from './timetable-detail-modal';

interface Props {
  initialData: TimetableData;
}

export function TimetablePage({ initialData }: Props) {
  const [data, setData] = useState<TimetableData>(initialData);
  const [viewMode, setViewMode] = useState<ViewMode>('ALL');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [detailCell, setDetailCell] = useState<TimetableClassCell | null>(null);
  const [isPending, startTransition] = useTransition();

  function loadWeek(weekStartISO: string) {
    startTransition(async () => {
      try {
        const fresh = await getTimetableData(weekStartISO);
        setData(fresh);
      } catch (err) {
        toast.error('Impossible de charger la semaine.');
        console.error(err);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Emploi du temps</h1>
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <TimetableExports
          data={data}
          viewMode={viewMode}
          selectedTeacherId={selectedTeacherId}
          selectedClassId={selectedClassId}
        />
      </div>

      <div className="no-print flex flex-col gap-3 rounded-lg border bg-card p-4 lg:flex-row lg:items-end lg:justify-between">
        <TimetableFilters
          viewMode={viewMode}
          onViewModeChange={(v) => {
            setViewMode(v);
            if (v === 'ALL') {
              setSelectedTeacherId('');
              setSelectedClassId('');
            }
          }}
          teachers={data.teachers}
          classes={data.classes}
          selectedTeacherId={selectedTeacherId}
          onTeacherChange={setSelectedTeacherId}
          selectedClassId={selectedClassId}
          onClassChange={setSelectedClassId}
        />
        <TimetableWeekNav
          weekStart={data.weekStart}
          weekEnd={data.weekEnd}
          onChange={loadWeek}
        />
      </div>

      <TimetableGrid
        data={data}
        viewMode={viewMode}
        selectedTeacherId={selectedTeacherId}
        selectedClassId={selectedClassId}
        onCellClick={(cell) => setDetailCell(cell)}
      />

      <TimetableSummary
        data={data}
        viewMode={viewMode}
        selectedTeacherId={selectedTeacherId}
        selectedClassId={selectedClassId}
      />

      {detailCell && (
        <TimetableDetailModal
          open={!!detailCell}
          onClose={() => setDetailCell(null)}
          cell={detailCell}
        />
      )}
    </div>
  );
}
