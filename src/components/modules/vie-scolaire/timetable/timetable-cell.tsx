'use client';

import { useState } from 'react';
import { CalendarPlus, Clock, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { TimeSlotValue as TimeSlot } from '@/lib/constants.client';
import type { TimetableClassCell } from '@/server/actions/timetable';
import { TimetableClassCard, type CardSize } from './timetable-class-card';
import { TIME_SLOT_LABELS } from '@/lib/constants.client';

export type CellVariant =
  | 'DISABLED'
  | 'EMPTY'
  | 'AVAILABLE'
  | 'CLASSES'
  | 'DIMMED';

interface Props {
  slot: TimeSlot | null;
  variant: CellVariant;
  cells: TimetableClassCell[];
  highlightClassId?: string;
  onCellClick: (cell: TimetableClassCell) => void;
}

function sizeFor(visibleCount: number): CardSize {
  if (visibleCount === 1) return 'full';
  if (visibleCount === 2) return 'compact';
  return 'ultra';
}

export function TimetableCell({
  slot,
  variant,
  cells,
  highlightClassId,
  onCellClick,
}: Props) {
  const [overflowOpen, setOverflowOpen] = useState(false);

  if (variant === 'DISABLED') {
    return (
      <div className="flex min-h-[160px] items-center justify-center border-b border-r bg-muted/30 p-3 text-xs italic text-muted-foreground/50 lg:border-b-0 lg:last:border-r-0">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Pas de cours
        </div>
      </div>
    );
  }

  if (variant === 'EMPTY' || variant === 'AVAILABLE') {
    const isAvailable = variant === 'AVAILABLE';
    return (
      <Link
        href="/admin/vie-scolaire/classes"
        className={cn(
          'flex min-h-[160px] flex-col items-center justify-center border-b border-r p-3 text-xs transition-colors lg:border-b-0 lg:last:border-r-0',
          isAvailable
            ? 'bg-emerald-50/50 text-emerald-700 hover:bg-emerald-50'
            : 'bg-muted/10 text-muted-foreground hover:bg-muted/30',
        )}
        title={
          isAvailable
            ? 'Créneau disponible pour ce prof'
            : 'Assigner une classe à ce créneau'
        }
      >
        <CalendarPlus className="h-5 w-5 opacity-50" />
        <span className="mt-1.5 font-medium">
          {isAvailable ? 'Disponible' : 'Libre'}
        </span>
        {slot && (
          <span className="mt-0.5 text-[10px] opacity-70">
            Assigner une classe
          </span>
        )}
      </Link>
    );
  }

  if (variant === 'DIMMED') {
    return (
      <div className="flex min-h-[160px] items-center justify-center border-b border-r bg-muted/20 p-3 text-xs text-muted-foreground opacity-40 lg:border-b-0 lg:last:border-r-0">
        <div className="text-center">
          <div className="font-medium">
            {cells.length} classe{cells.length > 1 ? 's' : ''}
          </div>
          <div className="text-[10px]">
            {cells[0]?.classLabel}
            {cells.length > 1
              ? ` +${cells.length - 1} autre${cells.length > 2 ? 's' : ''}`
              : ''}
          </div>
        </div>
      </div>
    );
  }

  // CLASSES variant — stack cards (1, 2, 3, or 3 + "+N autres")
  const MAX_VISIBLE = 3;
  const overflow = cells.length - MAX_VISIBLE;
  const visible = overflow > 0 ? cells.slice(0, MAX_VISIBLE) : cells;
  const size = sizeFor(visible.length);

  return (
    <>
      <div className="flex min-h-[160px] flex-col gap-1.5 border-b border-r p-2 lg:border-b-0 lg:last:border-r-0">
        {visible.map((c) => (
          <TimetableClassCard
            key={c.scheduleId}
            cell={c}
            size={size}
            highlight={highlightClassId === c.classGroupId}
            onClick={() => onCellClick(c)}
          />
        ))}
        {overflow > 0 && (
          <button
            type="button"
            onClick={() => setOverflowOpen(true)}
            className="no-print flex items-center justify-center gap-1 rounded-md border border-dashed border-primary/40 bg-primary/5 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/10"
          >
            <LayoutGrid className="h-3 w-3" />
            +{overflow} autre{overflow > 1 ? 's' : ''} classe{overflow > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {overflowOpen && slot && (
        <Dialog
          open={overflowOpen}
          onOpenChange={(v) => !v && setOverflowOpen(false)}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Toutes les classes · {TIME_SLOT_LABELS[slot]} ({cells.length})
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              {cells.map((c) => (
                <TimetableClassCard
                  key={c.scheduleId}
                  cell={c}
                  size="compact"
                  highlight={highlightClassId === c.classGroupId}
                  onClick={() => {
                    setOverflowOpen(false);
                    onCellClick(c);
                  }}
                />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
