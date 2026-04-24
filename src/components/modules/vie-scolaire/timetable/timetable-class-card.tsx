'use client';

import { Clock, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClassGenderBadge } from '@/components/modules/vie-scolaire/dashboard/class-gender-badge';
import { AttendanceTriggerButton } from '@/components/modules/vie-scolaire/dashboard/attendance-trigger-button';
import type { TimetableClassCell } from '@/server/actions/timetable';

export type CardSize = 'full' | 'compact' | 'ultra';

interface Props {
  cell: TimetableClassCell;
  onClick?: () => void;
  highlight?: boolean;
  size?: CardSize;
}

const GENDER_STYLES: Record<string, string> = {
  FILLE: 'bg-pink-50 border-pink-300 hover:border-pink-400',
  GARCON: 'bg-blue-50 border-blue-300 hover:border-blue-400',
  MIXTE: 'bg-purple-50 border-purple-300 hover:border-purple-400',
};

function AttendancePastille({
  cell,
  compact,
}: {
  cell: TimetableClassCell;
  compact: boolean;
}) {
  const { attendanceStatus, timing } = cell;
  const baseCls = cn(
    'inline-flex items-center gap-1 rounded-full border font-medium',
    compact ? 'px-1 py-0 text-[8px]' : 'px-1.5 py-0.5 text-[9px]',
  );

  if (timing === 'FUTURE') {
    return (
      <span
        title="À venir"
        className={cn(baseCls, 'border-gray-200 bg-gray-100 text-gray-600')}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        À venir
      </span>
    );
  }
  if (attendanceStatus === 'DONE') {
    return (
      <span
        title={`Appel fait (${cell.recordedCount}/${cell.studentCount})`}
        className={cn(baseCls, 'border-emerald-200 bg-emerald-100 text-emerald-700')}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Fait
      </span>
    );
  }
  if (attendanceStatus === 'PARTIAL') {
    return (
      <span
        title={`Appel partiel (${cell.recordedCount}/${cell.studentCount})`}
        className={cn(baseCls, 'border-amber-200 bg-amber-100 text-amber-700')}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Partiel
      </span>
    );
  }
  return (
    <span
      title="Appel non fait"
      className={cn(baseCls, 'border-red-200 bg-red-100 text-red-700')}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Non fait
    </span>
  );
}

export function TimetableClassCard({
  cell,
  onClick,
  highlight = false,
  size = 'full',
}: Props) {
  const showAttendanceButton =
    size === 'full' &&
    (cell.timing === 'TODAY' || cell.timing === 'PAST') &&
    cell.attendanceStatus !== 'DONE';

  const compactBadges = size !== 'full';
  const showSecondaryInfo = size !== 'ultra';

  const containerPadding =
    size === 'ultra' ? 'p-1.5' : size === 'compact' ? 'p-2' : 'p-2.5';
  const titleClass = size === 'ultra' ? 'text-[11px]' : 'text-sm';
  const subInfoClass = size === 'ultra' ? 'text-[9px]' : 'text-[11px]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full flex-col rounded-lg border text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        containerPadding,
        GENDER_STYLES[cell.classGender] ?? GENDER_STYLES.MIXTE,
        highlight && 'ring-2 ring-primary ring-offset-1 shadow-md',
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <div className={cn('truncate font-semibold', titleClass)}>
            {cell.classLabel}
          </div>
          {showSecondaryInfo && (
            <div className="truncate text-[10px] text-muted-foreground">
              {cell.levelLabel}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <ClassGenderBadge gender={cell.classGender} />
          <AttendancePastille cell={cell} compact={compactBadges} />
        </div>
      </div>
      <div className={cn('mt-1.5 space-y-0.5 text-muted-foreground', subInfoClass)}>
        {cell.teacherName ? (
          <div className="truncate">{cell.teacherName}</div>
        ) : (
          <div className="text-red-600">Pas de prof</div>
        )}
        {showSecondaryInfo && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {cell.startTime}–{cell.endTime}
          </div>
        )}
        {cell.room && (
          <div className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            {cell.room}
          </div>
        )}
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {cell.studentCount} élève{cell.studentCount > 1 ? 's' : ''}
        </div>
      </div>
      {showAttendanceButton && (
        <div className="no-print mt-2" onClick={(e) => e.stopPropagation()}>
          <AttendanceTriggerButton
            classGroupId={cell.classGroupId}
            dateISO={cell.slotDate}
            size="xs"
            variant="outline"
            label={cell.attendanceStatus === 'PARTIAL' ? "Compléter l'appel" : "Faire l'appel"}
          />
        </div>
      )}
    </button>
  );
}
