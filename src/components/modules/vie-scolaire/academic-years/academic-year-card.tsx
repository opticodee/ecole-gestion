'use client';

import {
  BookOpen,
  CheckCircle2,
  Eye,
  FileText,
  GraduationCap,
  Lock,
  Pencil,
  School,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ACADEMIC_YEAR_STATUS_COLORS,
  ACADEMIC_YEAR_STATUS_LABELS,
} from '@/lib/academic-year';
import { cn } from '@/lib/utils';
import { formatDateFR } from '@/lib/formatters';
import type { AcademicYearRow } from '@/server/actions/academic-years';

interface Props {
  year: AcademicYearRow;
  onEdit: () => void;
  onActivate: () => void;
  onClose: () => void;
  onDelete: () => void;
}

function TrimesterBadge({
  index,
  start,
  end,
}: {
  index: 1 | 2 | 3;
  start: string | null;
  end: string | null;
}) {
  if (!start || !end) {
    return (
      <span className="rounded-md border border-dashed border-muted-foreground/30 px-2 py-0.5 text-[10px] text-muted-foreground">
        T{index} : non défini
      </span>
    );
  }
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  return (
    <span className="rounded-md border bg-muted/30 px-2 py-0.5 text-[10px] text-foreground">
      <strong>T{index}</strong> : {fmt(s)} → {fmt(e)}
    </span>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-semibold">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

export function AcademicYearCard({
  year,
  onEdit,
  onActivate,
  onClose,
  onDelete,
}: Props) {
  const colors = ACADEMIC_YEAR_STATUS_COLORS[year.status];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border bg-card shadow-sm',
        'border-l-4',
        colors.border,
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold">Année scolaire {year.label}</h2>
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                colors.badge,
              )}
            >
              {ACADEMIC_YEAR_STATUS_LABELS[year.status]}
            </span>
            {year.status === 'CLOTUREE' && year.closedAt && (
              <span className="text-[10px] text-muted-foreground">
                Clôturée le {formatDateFR(year.closedAt)}
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Du <strong className="text-foreground">{formatDateFR(year.startDate)}</strong>{' '}
            au <strong className="text-foreground">{formatDateFR(year.endDate)}</strong>
          </p>

          <div className="flex flex-wrap gap-1.5">
            <TrimesterBadge index={1} start={year.trimestre1Start} end={year.trimestre1End} />
            <TrimesterBadge index={2} start={year.trimestre2Start} end={year.trimestre2End} />
            <TrimesterBadge index={3} start={year.trimestre3Start} end={year.trimestre3End} />
          </div>

          {(year.stats.classCount > 0 || year.stats.studentCount > 0) && (
            <div className="flex flex-wrap gap-1.5">
              <Stat icon={GraduationCap} value={year.stats.studentCount} label="élèves" />
              <Stat icon={School} value={year.stats.classCount} label="classes" />
              <Stat icon={BookOpen} value={year.stats.evaluationCount} label="évaluations" />
              <Stat icon={FileText} value={year.stats.appreciationCount} label="appréciations" />
            </div>
          )}
        </div>

        <div className="flex flex-row flex-wrap gap-1.5 sm:flex-col sm:items-stretch">
          {year.status === 'BROUILLON' && (
            <>
              <Button
                onClick={onActivate}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Activer
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </Button>
            </>
          )}

          {year.status === 'ACTIVE' && (
            <>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
                Modifier les dates
              </Button>
              <Button
                onClick={onClose}
                size="sm"
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                <Lock className="h-3.5 w-3.5" />
                Clôturer l&apos;année
              </Button>
            </>
          )}

          {year.status === 'CLOTUREE' && (
            <Button variant="outline" size="sm" disabled>
              <Eye className="h-3.5 w-3.5" />
              Archives (lecture seule)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
