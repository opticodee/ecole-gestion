'use client';

import Link from 'next/link';
import {
  BookOpen,
  ClipboardList,
  Clock,
  MapPin,
  School,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ClassGenderBadge } from '@/components/modules/vie-scolaire/dashboard/class-gender-badge';
import { AttendanceTriggerButton } from '@/components/modules/vie-scolaire/dashboard/attendance-trigger-button';
import { formatDateFR } from '@/lib/formatters';
import { TIME_SLOT_LABELS } from '@/lib/time-slots';
import { cn } from '@/lib/utils';
import type { TimetableClassCell } from '@/server/actions/timetable';

interface Props {
  open: boolean;
  onClose: () => void;
  cell: TimetableClassCell;
}

const GENDER_STYLES: Record<string, string> = {
  FILLE: 'border-pink-300 bg-pink-50',
  GARCON: 'border-blue-300 bg-blue-50',
  MIXTE: 'border-purple-300 bg-purple-50',
};

function AttendanceChip({ cell }: { cell: TimetableClassCell }) {
  if (cell.timing === 'FUTURE') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        À venir
      </span>
    );
  }
  if (cell.attendanceStatus === 'DONE') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Appel fait — {cell.recordedCount}/{cell.studentCount}
      </span>
    );
  }
  if (cell.attendanceStatus === 'PARTIAL') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        Partiel — {cell.recordedCount}/{cell.studentCount}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
      Appel non fait
    </span>
  );
}

export function TimetableDetailModal({ open, onClose, cell }: Props) {
  const slot = cell.slotDate;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span>{cell.classLabel}</span>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={cn(
              'rounded-lg border p-3',
              GENDER_STYLES[cell.classGender] ?? GENDER_STYLES.MIXTE,
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">{cell.classLabel}</div>
                <div className="text-xs text-muted-foreground">{cell.levelLabel}</div>
              </div>
              <ClassGenderBadge gender={cell.classGender} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                {cell.teacherName ?? (
                  <span className="text-red-600">Pas de prof</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {cell.startTime}–{cell.endTime}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {cell.room ?? '—'}
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                {cell.studentCount} élève{cell.studentCount > 1 ? 's' : ''}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                Séance du {formatDateFR(slot)} ·{' '}
                {cell.timing === 'TODAY'
                  ? "aujourd'hui"
                  : cell.timing === 'PAST'
                    ? 'passée'
                    : 'à venir'}
              </span>
              <AttendanceChip cell={cell} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                Dernier contenu
              </div>
              {cell.lastCourseContent ? (
                <>
                  <div className="text-sm font-medium">
                    {cell.lastCourseContent.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateFR(cell.lastCourseContent.date)}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Aucun contenu enregistré.</p>
              )}
            </div>
            <div className="rounded-lg border p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ClipboardList className="h-3.5 w-3.5" />
                Dernier devoir
              </div>
              {cell.lastHomework ? (
                <>
                  <div className="text-sm font-medium">{cell.lastHomework.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Échéance : {formatDateFR(cell.lastHomework.dueDate)}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Aucun devoir enregistré.</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <AttendanceTriggerButton
              classGroupId={cell.classGroupId}
              dateISO={slot}
              size="sm"
              label={
                cell.attendanceStatus === 'DONE'
                  ? "Voir l'appel"
                  : cell.attendanceStatus === 'PARTIAL'
                    ? "Compléter l'appel"
                    : "Faire l'appel"
              }
            />
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/admin/vie-scolaire/classes" />}
            >
              <School className="h-3.5 w-3.5" />
              Voir la classe
            </Button>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/admin/vie-scolaire/contenu-cours" />}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Ajouter contenu
            </Button>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/admin/vie-scolaire/devoirs" />}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Ajouter un devoir
            </Button>
            {cell.teacherId && (
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link href={`/admin/vie-scolaire/enseignants/${cell.teacherId}`} />
                }
              >
                <UserCheck className="h-3.5 w-3.5" />
                Fiche prof
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* Slot label helper kept in case future screens need it without importing constants */
export { TIME_SLOT_LABELS };
