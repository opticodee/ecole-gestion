'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Loader2, Save, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toSelectItems,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  MENTION_COLORS,
  MENTION_LABELS,
  SAISIE_PERIODS,
  formatAverage,
} from '@/lib/bulletin';
import {
  COUNCIL_DECISION_COLORS,
  COUNCIL_DECISION_LABELS,
  COUNCIL_DECISIONS,
  type CouncilDecision,
} from '@/lib/validators/council';
import {
  getCouncilData,
  saveCouncilDecisions,
  type CouncilRow,
  type CouncilSummary,
} from '@/server/actions/council';
import type { GradesSummaryOptions } from '@/server/actions/grades-summary';
import { CouncilPvExport } from './council-pv-export';

interface Props {
  options: GradesSummaryOptions;
}

export function CouncilView({ options }: Props) {
  const [classId, setClassId] = useState<string>(options.classes[0]?.id ?? '');
  const [period, setPeriod] = useState<number>(1);
  const [data, setData] = useState<CouncilSummary | null>(null);
  const [rows, setRows] = useState<CouncilRow[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  function handleLoad() {
    if (!classId) {
      toast.error('Veuillez sélectionner une classe.');
      return;
    }
    startTransition(async () => {
      const result = await getCouncilData(classId, period);
      if (result.error) {
        toast.error(result.error);
        setData(null);
        setRows([]);
        return;
      }
      setData(result.data ?? null);
      setRows(result.data ? result.data.rows.map((r) => ({ ...r })) : []);
    });
  }

  function updateDecision(studentId: string, value: string) {
    const val: CouncilDecision | null = value === 'NONE' || value === '' ? null : (value as CouncilDecision);
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, councilDecision: val } : r)),
    );
  }

  function updateObservation(studentId: string, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, councilObservation: value } : r)),
    );
  }

  async function handleSave() {
    if (!data) return;
    setIsSaving(true);
    const result = await saveCouncilDecisions({
      classGroupId: classId,
      period,
      entries: rows.map((r) => ({
        studentId: r.studentId,
        councilDecision: r.councilDecision ?? 'NONE',
        councilObservation: r.councilObservation || null,
      })),
    });
    setIsSaving(false);
    if ('error' in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Décisions du conseil enregistrées.');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Conseil de classe</h1>
        </div>
        {data && <CouncilPvExport data={data} rows={rows} />}
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
            value={String(period)}
            onValueChange={(v) => setPeriod(Number(v ?? '1'))}
            items={SAISIE_PERIODS.map((p) => ({
              value: String(p.periodNumber),
              label: p.label,
            }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SAISIE_PERIODS.map((p) => (
                <SelectItem key={p.key} value={String(p.periodNumber)}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleLoad} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Charger le conseil
        </Button>
      </div>

      {data && (
        <>
          <CouncilSummaryPanel data={data} />

          <div className="print-container overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead>Élève</TableHead>
                  <TableHead className="text-center">Moyenne</TableHead>
                  <TableHead className="text-center">Rang</TableHead>
                  <TableHead className="text-center">Absences</TableHead>
                  <TableHead>Mention</TableHead>
                  <TableHead className="min-w-[16rem]">Appréciation</TableHead>
                  <TableHead className="no-print min-w-[14rem]">Décision</TableHead>
                  <TableHead className="no-print min-w-[14rem]">Observation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.studentId}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/vie-scolaire/eleves/${r.studentId}`}
                        className="hover:underline"
                      >
                        {r.lastName.toUpperCase()} {r.firstName}
                      </Link>
                      <div className="text-[10px] text-muted-foreground">{r.matricule}</div>
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {formatAverage(r.overallAverage)}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {r.overallAverage === null ? '—' : `${r.rank}`}
                    </TableCell>
                    <TableCell className="text-center text-sm">{r.absenceCount}</TableCell>
                    <TableCell>
                      {r.effectiveMention ? (
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                            MENTION_COLORS[r.effectiveMention],
                          )}
                        >
                          {MENTION_LABELS[r.effectiveMention]}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[16rem] truncate text-xs text-muted-foreground">
                      {r.generalComment || '—'}
                    </TableCell>
                    <TableCell className="no-print">
                      <select
                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        value={r.councilDecision ?? 'NONE'}
                        onChange={(e) => updateDecision(r.studentId, e.target.value)}
                      >
                        {COUNCIL_DECISIONS.map((d) => (
                          <option key={d} value={d}>
                            {COUNCIL_DECISION_LABELS[d]}
                          </option>
                        ))}
                      </select>
                      {r.councilDecision && r.councilDecision !== 'NONE' && (
                        <span
                          className={cn(
                            'mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                            COUNCIL_DECISION_COLORS[r.councilDecision],
                          )}
                        >
                          {COUNCIL_DECISION_LABELS[r.councilDecision]}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="no-print">
                      <textarea
                        className="w-full min-h-[40px] rounded-md border border-input bg-background p-2 text-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        rows={2}
                        value={r.councilObservation ?? ''}
                        onChange={(e) => updateObservation(r.studentId, e.target.value)}
                        placeholder="Ex: doit améliorer sa régularité..."
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="no-print flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Enregistrement...' : 'Enregistrer le conseil'}
            </Button>
          </div>
        </>
      )}

      {!data && !isPending && (
        <div className="rounded-lg border border-dashed bg-muted/20 py-16 text-center text-sm text-muted-foreground">
          Sélectionnez une classe et un trimestre, puis cliquez sur « Charger le conseil ».
        </div>
      )}
    </div>
  );
}

function CouncilSummaryPanel({ data }: { data: CouncilSummary }) {
  const decisionSummary = Object.entries(data.decisionCounts)
    .filter(([k, v]) => k !== 'NONE' && v > 0)
    .map(([k, v]) => `${v} ${COUNCIL_DECISION_LABELS[k as CouncilDecision]}`)
    .join(' · ');

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold">{data.classLabel}</span>
        <span className="text-muted-foreground">Niveau : {data.levelLabel}</span>
        <span className="text-muted-foreground">Année : {data.academicYearLabel}</span>
        <span className="text-muted-foreground">Trimestre : {data.period}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border bg-muted/30 p-2">
          <div className="text-[10px] uppercase text-muted-foreground">Moy. classe</div>
          <div className="text-lg font-bold">{formatAverage(data.classAverage)}</div>
        </div>
        <div className="rounded-md border bg-muted/30 p-2">
          <div className="text-[10px] uppercase text-muted-foreground">Élèves</div>
          <div className="text-lg font-bold">{data.totalStudents}</div>
        </div>
        <div className="rounded-md border bg-muted/30 p-2">
          <div className="text-[10px] uppercase text-muted-foreground">Taux présence</div>
          <div className="text-lg font-bold">
            {data.attendanceRate === null ? '—' : `${data.attendanceRate}%`}
          </div>
        </div>
        <div className="rounded-md border bg-muted/30 p-2">
          <div className="text-[10px] uppercase text-muted-foreground">Décisions</div>
          <div className="text-xs font-medium">
            {decisionSummary || 'Aucune décision enregistrée'}
          </div>
        </div>
      </div>
    </div>
  );
}
