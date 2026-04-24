'use client';

import { useState, useTransition } from 'react';
import { BarChart3, Loader2, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toSelectItems,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { PERIODS, type PeriodKey } from '@/lib/bulletin';
import {
  getGradesSummary,
  type GradesSummary,
  type GradesSummaryOptions,
} from '@/server/actions/grades-summary';
import { GradesSummaryClassView } from './grades-summary-class-view';
import { GradesSummaryStudentView } from './grades-summary-student-view';
import { GradesSummaryExports } from './grades-summary-exports';

interface Props {
  options: GradesSummaryOptions;
}

export function GradesSummaryView({ options }: Props) {
  const [classId, setClassId] = useState<string>(options.classes[0]?.id ?? '');
  const [periodKey, setPeriodKey] = useState<PeriodKey>('T1');
  const [viewMode, setViewMode] = useState<'class' | 'student'>('class');
  const [summary, setSummary] = useState<GradesSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleLoad() {
    if (!classId) {
      toast.error('Veuillez sélectionner une classe.');
      return;
    }
    startTransition(async () => {
      const result = await getGradesSummary(classId, periodKey);
      if (result.error) {
        toast.error(result.error);
        setSummary(null);
        return;
      }
      setSummary(result.data ?? null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Notes & Moyennes</h1>
        </div>
        {summary && <GradesSummaryExports summary={summary} />}
      </div>

      <div className="no-print flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Classe</label>
          <Select
            value={classId}
            onValueChange={(v) => setClassId(v ?? '')}
            items={toSelectItems(options.classes, 'id', 'label')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner une classe" />
            </SelectTrigger>
            <SelectContent>
              {options.classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Période</label>
          <Select
            value={periodKey}
            onValueChange={(v) => setPeriodKey((v ?? 'T1') as PeriodKey)}
            items={PERIODS.map((p) => ({ value: p.key, label: p.label }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.key} value={p.key}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleLoad} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Afficher
        </Button>
      </div>

      {summary && (
        <>
          <div className="no-print flex items-center gap-2 border-b">
            <button
              onClick={() => setViewMode('class')}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'class'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="h-4 w-4" />
              Vue classe
            </button>
            <button
              onClick={() => setViewMode('student')}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'student'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="h-4 w-4" />
              Vue élève
            </button>
          </div>

          {viewMode === 'class' ? (
            <GradesSummaryClassView summary={summary} />
          ) : (
            <GradesSummaryStudentView summary={summary} />
          )}
        </>
      )}

      {!summary && !isPending && (
        <div className="rounded-lg border border-dashed bg-muted/20 py-16 text-center text-sm text-muted-foreground">
          Sélectionnez une classe et une période, puis cliquez sur « Afficher ».
        </div>
      )}
    </div>
  );
}
