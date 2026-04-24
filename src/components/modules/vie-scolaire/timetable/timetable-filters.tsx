'use client';

import { cn } from '@/lib/utils';

export type ViewMode = 'ALL' | 'BY_TEACHER' | 'BY_CLASS';

interface Props {
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  teachers: { id: string; name: string; classCount: number; studentCount: number }[];
  classes: { id: string; label: string }[];
  selectedTeacherId: string;
  onTeacherChange: (id: string) => void;
  selectedClassId: string;
  onClassChange: (id: string) => void;
}

const OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'ALL', label: 'Toutes les classes' },
  { value: 'BY_TEACHER', label: 'Par enseignant' },
  { value: 'BY_CLASS', label: 'Par classe' },
];

export function TimetableFilters({
  viewMode,
  onViewModeChange,
  teachers,
  classes,
  selectedTeacherId,
  onTeacherChange,
  selectedClassId,
  onClassChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Vue</label>
        <div className="inline-flex rounded-md border bg-muted/40 p-0.5">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => onViewModeChange(o.value)}
              className={cn(
                'rounded px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === o.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'BY_TEACHER' && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Enseignant</label>
          <select
            value={selectedTeacherId}
            onChange={(e) => onTeacherChange(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <option value="">— Tous les enseignants —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.classCount} classe{t.classCount > 1 ? 's' : ''} · {t.studentCount} élèves)
              </option>
            ))}
          </select>
        </div>
      )}

      {viewMode === 'BY_CLASS' && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Classe</label>
          <select
            value={selectedClassId}
            onChange={(e) => onClassChange(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <option value="">— Toutes les classes —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
