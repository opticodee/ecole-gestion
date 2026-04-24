'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookMarked,
  ChevronDown,
  ChevronRight,
  DoorOpen,
  UserCheck,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TIME_SLOTS, TIME_SLOT_LABELS } from '@/lib/constants.client';
import type {
  TimetableClassCell,
  TimetableData,
} from '@/server/actions/timetable';
import type { ViewMode } from './timetable-filters';
import { ClassGenderBadge } from '@/components/modules/vie-scolaire/dashboard/class-gender-badge';

interface Props {
  data: TimetableData;
  viewMode: ViewMode;
  selectedTeacherId: string;
  selectedClassId: string;
}

function Stat({
  label,
  value,
  sub,
  icon: Icon,
  children,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
      {children}
    </div>
  );
}

function filterCells(
  cells: TimetableClassCell[],
  viewMode: ViewMode,
  teacherId: string,
  classId: string,
): TimetableClassCell[] {
  return cells.filter((c) => {
    if (viewMode === 'BY_TEACHER' && teacherId) return c.teacherId === teacherId;
    if (viewMode === 'BY_CLASS' && classId) return c.classGroupId === classId;
    return true;
  });
}

export function TimetableSummary({
  data,
  viewMode,
  selectedTeacherId,
  selectedClassId,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const { kpis } = data;
  const occupiedPct =
    kpis.totalSlots > 0 ? Math.round((kpis.occupied / kpis.totalSlots) * 100) : 0;

  // Build recap rows: 1 row per class (flattened), with "Libre" rows for empty slots
  type RecapRow = { slot: (typeof TIME_SLOTS)[number]; cell: TimetableClassCell | null };
  const recapRows: RecapRow[] = [];
  let visibleClassesCount = 0;
  for (const slot of TIME_SLOTS) {
    const all = data.cells[slot] ?? [];
    const filtered = filterCells(all, viewMode, selectedTeacherId, selectedClassId);
    if (filtered.length === 0) {
      recapRows.push({ slot, cell: null });
    } else {
      for (const c of filtered) {
        recapRows.push({ slot, cell: c });
        visibleClassesCount++;
      }
    }
  }

  return (
    <div className="no-print space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Créneaux occupés" value={`${kpis.occupied}/${kpis.totalSlots}`}>
          <div className="mt-2 h-1.5 rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${occupiedPct}%` }}
            />
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground">{occupiedPct}%</div>
        </Stat>
        <Stat
          label="Total classes planifiées"
          value={kpis.plannedClasses}
          icon={BookMarked}
          sub="Sur les 5 créneaux"
        />
        <Stat
          label="Total élèves planifiés"
          value={kpis.plannedStudents}
          icon={Users}
          sub="Sur les créneaux occupés"
        />
        <Stat
          label="Enseignants actifs"
          value={kpis.activeTeachers}
          icon={UserCheck}
          sub="Au moins une classe"
        />
        <Stat
          label="Créneaux libres"
          value={kpis.freeSlots}
          icon={DoorOpen}
          sub="Disponibles à assigner"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold hover:bg-muted/40"
        >
          <span className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Tableau récapitulatif ({visibleClassesCount} classe
            {visibleClassesCount > 1 ? 's' : ''})
          </span>
        </button>
        {expanded && (
          <div className="overflow-x-auto border-t">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead>Créneau</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Enseignant</TableHead>
                  <TableHead>Salle</TableHead>
                  <TableHead className="text-center">Élèves</TableHead>
                  <TableHead>Statut appel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recapRows.map(({ slot, cell }, idx) => (
                  <TableRow key={`${slot}-${idx}`}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {TIME_SLOT_LABELS[slot]}
                    </TableCell>
                    {cell ? (
                      <>
                        <TableCell className="font-medium">
                          <Link
                            href="/admin/vie-scolaire/classes"
                            className="hover:underline"
                          >
                            {cell.classLabel}
                          </Link>
                          <div className="text-[10px] text-muted-foreground">
                            {cell.startTime}–{cell.endTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <ClassGenderBadge gender={cell.classGender} />
                        </TableCell>
                        <TableCell className="text-xs">
                          {cell.teacherId ? (
                            <Link
                              href={`/admin/vie-scolaire/enseignants/${cell.teacherId}`}
                              className="hover:underline"
                            >
                              {cell.teacherName}
                            </Link>
                          ) : (
                            <span className="text-red-600">Pas de prof</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{cell.room ?? '—'}</TableCell>
                        <TableCell className="text-center text-sm">
                          {cell.studentCount}
                        </TableCell>
                        <TableCell>
                          <AttendanceStatusBadge
                            status={cell.attendanceStatus}
                            timing={cell.timing}
                            recorded={cell.recordedCount}
                            total={cell.studentCount}
                          />
                        </TableCell>
                      </>
                    ) : (
                      <TableCell
                        colSpan={6}
                        className="text-xs italic text-muted-foreground"
                      >
                        Libre
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function AttendanceStatusBadge({
  status,
  timing,
  recorded,
  total,
}: {
  status: 'DONE' | 'PARTIAL' | 'NONE';
  timing: 'PAST' | 'TODAY' | 'FUTURE';
  recorded: number;
  total: number;
}) {
  if (timing === 'FUTURE') {
    return (
      <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
        À venir
      </span>
    );
  }
  const cls = cn(
    'rounded-full border px-2 py-0.5 text-[10px] font-medium',
    status === 'DONE' && 'border-emerald-200 bg-emerald-100 text-emerald-700',
    status === 'PARTIAL' && 'border-amber-200 bg-amber-100 text-amber-700',
    status === 'NONE' && 'border-red-200 bg-red-100 text-red-700',
  );
  const label =
    status === 'DONE'
      ? `Fait · ${recorded}/${total}`
      : status === 'PARTIAL'
        ? `Partiel · ${recorded}/${total}`
        : 'Non fait';
  return <span className={cls}>{label}</span>;
}
