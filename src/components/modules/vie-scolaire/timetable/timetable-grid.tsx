'use client';

import { cn } from '@/lib/utils';
import type { TimeSlot } from '@prisma/client';
import type {
  TimetableClassCell,
  TimetableData,
} from '@/server/actions/timetable';
import type { ViewMode } from './timetable-filters';
import { TimetableCell, type CellVariant } from './timetable-cell';

const DAY_LABELS = ['Mercredi', 'Samedi', 'Dimanche'] as const;
type Day = (typeof DAY_LABELS)[number];
type Period = 'AM' | 'PM';

const CELL_MATRIX: Record<Day, Record<Period, TimeSlot | null>> = {
  Mercredi: { AM: null, PM: 'MERCREDI_PM' },
  Samedi: { AM: 'SAMEDI_AM', PM: 'SAMEDI_PM' },
  Dimanche: { AM: 'DIMANCHE_AM', PM: 'DIMANCHE_PM' },
};

interface Props {
  data: TimetableData;
  viewMode: ViewMode;
  selectedTeacherId: string;
  selectedClassId: string;
  onCellClick: (cell: TimetableClassCell) => void;
}

export function TimetableGrid({
  data,
  viewMode,
  selectedTeacherId,
  selectedClassId,
  onCellClick,
}: Props) {
  function resolveSlot(
    slot: TimeSlot | null,
  ): { variant: CellVariant; cells: TimetableClassCell[] } {
    if (!slot) return { variant: 'DISABLED', cells: [] };
    const all = data.cells[slot] ?? [];

    if (viewMode === 'BY_TEACHER') {
      if (!selectedTeacherId) {
        // No teacher picked yet → behave like ALL
        return all.length > 0
          ? { variant: 'CLASSES', cells: all }
          : { variant: 'EMPTY', cells: [] };
      }
      const filtered = all.filter((c) => c.teacherId === selectedTeacherId);
      return filtered.length > 0
        ? { variant: 'CLASSES', cells: filtered }
        : { variant: 'AVAILABLE', cells: [] };
    }

    if (viewMode === 'BY_CLASS') {
      if (!selectedClassId) {
        return all.length > 0
          ? { variant: 'CLASSES', cells: all }
          : { variant: 'EMPTY', cells: [] };
      }
      const isTarget = all.some((c) => c.classGroupId === selectedClassId);
      if (isTarget) return { variant: 'CLASSES', cells: all };
      return all.length > 0
        ? { variant: 'DIMMED', cells: all }
        : { variant: 'EMPTY', cells: [] };
    }

    // ALL
    return all.length > 0
      ? { variant: 'CLASSES', cells: all }
      : { variant: 'EMPTY', cells: [] };
  }

  const highlightClassId =
    viewMode === 'BY_CLASS' && selectedClassId ? selectedClassId : undefined;

  return (
    <div className="print-container overflow-x-auto rounded-lg border bg-card">
      {/* Desktop grid */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-[5rem_repeat(3,1fr)] gap-0">
          {/* Header row */}
          <div className="border-b border-r bg-muted/40 p-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Créneau
          </div>
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="border-b bg-muted/40 p-2 text-center text-sm font-semibold"
            >
              {d}
            </div>
          ))}

          {/* Matin row */}
          <div className="border-r bg-muted/40 p-2 text-center text-xs font-semibold uppercase text-muted-foreground">
            Matin
            <div className="text-[10px] font-normal normal-case text-muted-foreground/70">
              09:00 – 12:00
            </div>
          </div>
          {DAY_LABELS.map((d) => {
            const slot = CELL_MATRIX[d].AM;
            const { variant, cells } = resolveSlot(slot);
            return (
              <TimetableCell
                key={`${d}-AM`}
                slot={slot}
                variant={variant}
                cells={cells}
                highlightClassId={highlightClassId}
                onCellClick={onCellClick}
              />
            );
          })}

          {/* Après-midi row */}
          <div className="border-t border-r bg-muted/40 p-2 text-center text-xs font-semibold uppercase text-muted-foreground">
            Après-midi
            <div className="text-[10px] font-normal normal-case text-muted-foreground/70">
              14:00 – 17:00
            </div>
          </div>
          {DAY_LABELS.map((d) => {
            const slot = CELL_MATRIX[d].PM;
            const { variant, cells } = resolveSlot(slot);
            return (
              <TimetableCell
                key={`${d}-PM`}
                slot={slot}
                variant={variant}
                cells={cells}
                highlightClassId={highlightClassId}
                onCellClick={onCellClick}
              />
            );
          })}
        </div>
      </div>

      {/* Mobile list */}
      <div className="lg:hidden">
        <div className="divide-y">
          {DAY_LABELS.flatMap((d) =>
            (['AM', 'PM'] as Period[]).map((p) => {
              const slot = CELL_MATRIX[d][p];
              const { variant, cells } = resolveSlot(slot);
              return (
                <div key={`${d}-${p}`} className="p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      {d} {p === 'AM' ? 'matin' : 'après-midi'}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {p === 'AM' ? '09:00 – 12:00' : '14:00 – 17:00'}
                    </div>
                  </div>
                  <div className={cn('min-h-[120px]', slot === null ? 'opacity-60' : '')}>
                    <TimetableCell
                      slot={slot}
                      variant={variant}
                      cells={cells}
                      highlightClassId={highlightClassId}
                      onCellClick={onCellClick}
                    />
                  </div>
                </div>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
