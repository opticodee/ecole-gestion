'use client';

import { useState, useTransition } from 'react';
import { Award, Loader2, Save } from 'lucide-react';
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
import {
  MENTION_COLORS,
  MENTION_LABELS,
  MENTION_OPTIONS,
  SAISIE_PERIODS,
  formatAverage,
  type MentionKey,
} from '@/lib/bulletin';
import { cn } from '@/lib/utils';
import {
  getMentionsData,
  saveMentions,
  type MentionsData,
} from '@/server/actions/mentions';
import type { GradesSummaryOptions } from '@/server/actions/grades-summary';

interface Props {
  options: GradesSummaryOptions;
}

type Row = MentionsData['rows'][number];

export function MentionsView({ options }: Props) {
  const [classId, setClassId] = useState<string>(options.classes[0]?.id ?? '');
  const [period, setPeriod] = useState<number>(1);
  const [data, setData] = useState<MentionsData | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  function handleLoad() {
    if (!classId) {
      toast.error('Veuillez sélectionner une classe.');
      return;
    }
    startTransition(async () => {
      const result = await getMentionsData(classId, period);
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

  function updateManualMention(studentId: string, value: string) {
    const val: MentionKey | null = value === '' ? null : (value as MentionKey);
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, manualMention: val } : r)),
    );
  }

  function updateCouncilComment(studentId: string, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, councilComment: value } : r)),
    );
  }

  async function handleSave() {
    if (!data) return;
    setIsSaving(true);
    const result = await saveMentions({
      classGroupId: classId,
      period,
      entries: rows.map((r) => ({
        studentId: r.studentId,
        manualMention: r.manualMention,
        councilComment: r.councilComment || null,
      })),
    });
    setIsSaving(false);
    if ('error' in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Mentions enregistrées.');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Award className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Mentions</h1>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Classe</label>
          <Select
            value={classId}
            onValueChange={(v) => setClassId(v ?? '')}
            items={toSelectItems(options.classes, 'id', 'label')}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
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
          Charger
        </Button>
      </div>

      {data && (
        <>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
              <span className="font-semibold">{data.classLabel}</span>
              <span className="text-muted-foreground">Niveau : {data.levelLabel}</span>
              <span className="text-muted-foreground">Année : {data.academicYearLabel}</span>
              <span className="text-muted-foreground">Trimestre : {data.period}</span>
              <span className="ml-auto text-xs text-muted-foreground">{rows.length} élève(s)</span>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
            Les mentions sont attribuées automatiquement selon la moyenne générale :
            <ul className="mt-1 ml-4 list-disc space-y-0.5">
              <li>≥ 9 : Excellent · ≥ 8 : Très bien · ≥ 7 : Bien · ≥ 5 : Passable · &lt; 5 : Insuffisant</li>
              <li>Vous pouvez overrider manuellement via le menu déroulant.</li>
            </ul>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead>Élève</TableHead>
                  <TableHead className="text-center">Moyenne</TableHead>
                  <TableHead>Mention automatique</TableHead>
                  <TableHead>Mention manuelle (override)</TableHead>
                  <TableHead className="min-w-[18rem]">Commentaire du conseil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const effective = r.manualMention ?? r.autoMention;
                  return (
                    <TableRow key={r.studentId}>
                      <TableCell className="font-medium">
                        {r.lastName.toUpperCase()} {r.firstName}
                        <div className="text-[10px] text-muted-foreground">{r.matricule}</div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {formatAverage(r.overallAverage)}
                      </TableCell>
                      <TableCell>
                        {r.autoMention ? (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                              MENTION_COLORS[r.autoMention],
                            )}
                          >
                            {MENTION_LABELS[r.autoMention]}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <select
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                            value={r.manualMention ?? ''}
                            onChange={(e) => updateManualMention(r.studentId, e.target.value)}
                          >
                            <option value="">— Auto —</option>
                            {MENTION_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {r.manualMention && effective && (
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                                MENTION_COLORS[effective],
                              )}
                            >
                              {MENTION_LABELS[effective]}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <textarea
                          className="w-full min-h-[44px] rounded-md border border-input bg-background p-2 text-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                          rows={2}
                          value={r.councilComment ?? ''}
                          onChange={(e) => updateCouncilComment(r.studentId, e.target.value)}
                          placeholder="Commentaire du conseil de classe..."
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Enregistrement...' : 'Enregistrer les mentions'}
            </Button>
          </div>
        </>
      )}

      {!data && !isPending && (
        <div className="rounded-lg border border-dashed bg-muted/20 py-16 text-center text-sm text-muted-foreground">
          Sélectionnez une classe et un trimestre, puis cliquez sur « Charger ».
        </div>
      )}
    </div>
  );
}
