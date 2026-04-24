'use client';

import { useState, useTransition } from 'react';
import {
  AlertTriangle,
  ArrowUpCircle,
  FileDown,
  FileText,
  Loader2,
  Lock,
  Printer,
  Save,
  ShieldCheck,
} from 'lucide-react';
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
import { MENTION_COLORS, MENTION_LABELS, formatAverage } from '@/lib/bulletin';
import {
  TRANSITION_DECISION_COLORS,
  TRANSITION_DECISION_LABELS,
  TRANSITION_DECISION_SHORT,
  TRANSITION_DECISIONS,
  type TransitionDecisionValue,
} from '@/lib/validators/transition';
import {
  getTransitionsData,
  saveTransitions,
  type TransitionData,
  type TransitionOptions,
  type TransitionRow,
} from '@/server/actions/transitions';
import { TransitionApplyDialog } from './transition-apply-dialog';
import { formatDateFR } from '@/lib/formatters';

interface Props {
  options: TransitionOptions;
}

export function TransitionsView({ options }: Props) {
  const [classId, setClassId] = useState<string>(options.classes[0]?.id ?? '');
  const [data, setData] = useState<TransitionData | null>(null);
  const [rows, setRows] = useState<TransitionRow[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);

  function handleLoad() {
    if (!classId) {
      toast.error('Veuillez sélectionner une classe.');
      return;
    }
    startTransition(async () => {
      const result = await getTransitionsData(classId);
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

  function updateRow(studentId: string, patch: Partial<TransitionRow>) {
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, ...patch } : r)),
    );
  }

  async function handleSave() {
    if (!data) return;
    setIsSaving(true);
    const result = await saveTransitions({
      classGroupId: classId,
      entries: rows.map((r) => ({
        studentId: r.studentId,
        decision: r.decision,
        toClassGroupId: r.decision === 'PASSAGE' ? r.toClassGroupId : null,
        toLevelId: r.decision === 'PASSAGE' ? r.toLevelId : null,
        observation: r.observation || null,
      })),
    });
    setIsSaving(false);
    if ('error' in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Décisions enregistrées.');
    handleLoad();
  }

  function handleApplied() {
    handleLoad();
  }

  async function exportCsv() {
    if (!data) return;
    const Papa = (await import('papaparse')).default;
    const csvRows = rows.map((r) => ({
      Rang: r.yearAverage === null ? '' : r.yearRank,
      Nom: r.lastName,
      Prénom: r.firstName,
      Matricule: r.matricule,
      'Moyenne annuelle': formatAverage(r.yearAverage),
      Mention: r.yearMention ? MENTION_LABELS[r.yearMention] : '',
      'Niveau actuel': r.currentLevelLabel,
      Décision: TRANSITION_DECISION_LABELS[r.decision],
      'Nouvelle classe':
        r.decision === 'PASSAGE' && r.toClassGroupId
          ? options.targetClasses.find((c) => c.id === r.toClassGroupId)?.label ?? ''
          : '',
      Observation: r.observation || '',
    }));
    const csv = Papa.unparse(csvRows);
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passages-${data.classLabel}.csv`.toLowerCase().replace(/[^a-z0-9.-]+/g, '-');
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  async function exportPdf() {
    if (!data) return;
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });
    doc.setFontSize(14);
    doc.text('Décisions de passage — ACMSCHOOL', 14, 15);
    doc.setFontSize(9);
    doc.text(
      `${data.classLabel} — Année ${data.academicYearLabel} — Généré le ${formatDateFR(new Date())}`,
      14,
      22,
    );
    const headers = ['Rang', 'Nom', 'Prénom', 'Moy.', 'Mention', 'Décision', 'Nouvelle classe'];
    autoTable(doc, {
      startY: 28,
      head: [headers],
      body: rows.map((r) => [
        r.yearAverage === null ? '' : r.yearRank,
        r.lastName,
        r.firstName,
        formatAverage(r.yearAverage),
        r.yearMention ? MENTION_LABELS[r.yearMention] : '',
        TRANSITION_DECISION_LABELS[r.decision],
        r.decision === 'PASSAGE' && r.toClassGroupId
          ? options.targetClasses.find((c) => c.id === r.toClassGroupId)?.label ?? ''
          : '',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 101, 52] },
    });
    doc.save(`passages-${data.classLabel}.pdf`.toLowerCase().replace(/[^a-z0-9.-]+/g, '-'));
  }

  const locked = data?.isApplied ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpCircle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Passage de classe</h1>
          {locked && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              <Lock className="h-3 w-3" />
              Passages appliqués
            </span>
          )}
        </div>
        {data && (
          <div className="no-print flex flex-wrap gap-1.5">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <FileText className="h-3.5 w-3.5" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportPdf}>
              <FileDown className="h-3.5 w-3.5" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" />
              Imprimer
            </Button>
          </div>
        )}
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
        <Button onClick={handleLoad} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Charger
        </Button>
      </div>

      {data && (
        <>
          <SummaryPanel data={data} />

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead>Élève</TableHead>
                  <TableHead className="text-center">Moy. an.</TableHead>
                  <TableHead className="text-center">Rang</TableHead>
                  <TableHead>Mention</TableHead>
                  <TableHead>Niveau actuel</TableHead>
                  <TableHead className="min-w-[14rem]">Décision</TableHead>
                  <TableHead className="min-w-[18rem]">Nouvelle classe</TableHead>
                  <TableHead className="min-w-[14rem]">Observation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  // Filter target classes by level + gender compat
                  const levelId = r.toLevelId;
                  const compatible = options.targetClasses.filter((c) => {
                    if (levelId && c.levelId !== levelId) return false;
                    if (c.classGender === 'MIXTE') return true;
                    if (r.gender === 'MALE') return c.classGender === 'GARCON';
                    return c.classGender === 'FILLE';
                  });

                  return (
                    <TableRow key={r.studentId}>
                      <TableCell className="font-medium">
                        {r.lastName.toUpperCase()} {r.firstName}
                        <div className="text-[10px] text-muted-foreground">{r.matricule}</div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {formatAverage(r.yearAverage)}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {r.yearAverage === null ? '—' : r.yearRank}
                      </TableCell>
                      <TableCell>
                        {r.yearMention ? (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                              MENTION_COLORS[r.yearMention],
                            )}
                          >
                            {MENTION_LABELS[r.yearMention]}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{r.currentLevelLabel}</TableCell>
                      <TableCell>
                        <select
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs disabled:opacity-60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                          value={r.decision}
                          disabled={locked}
                          onChange={(e) =>
                            updateRow(r.studentId, {
                              decision: e.target.value as TransitionDecisionValue,
                              toClassGroupId:
                                e.target.value === 'PASSAGE' ? r.toClassGroupId : null,
                            })
                          }
                        >
                          {TRANSITION_DECISIONS.map((d) => (
                            <option key={d} value={d}>
                              {TRANSITION_DECISION_LABELS[d]}
                            </option>
                          ))}
                        </select>
                        {r.decision !== 'EN_ATTENTE' && (
                          <span
                            className={cn(
                              'mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                              TRANSITION_DECISION_COLORS[r.decision],
                            )}
                          >
                            {TRANSITION_DECISION_SHORT[r.decision]}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.decision === 'PASSAGE' ? (
                          <div className="space-y-1.5">
                            <select
                              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs disabled:opacity-60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                              value={r.toLevelId ?? ''}
                              disabled={locked}
                              onChange={(e) =>
                                updateRow(r.studentId, {
                                  toLevelId: e.target.value || null,
                                  toClassGroupId: null,
                                })
                              }
                            >
                              <option value="">— Niveau —</option>
                              {options.levels.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.label}
                                </option>
                              ))}
                            </select>
                            <select
                              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs disabled:opacity-60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                              value={r.toClassGroupId ?? ''}
                              disabled={locked || !r.toLevelId}
                              onChange={(e) =>
                                updateRow(r.studentId, {
                                  toClassGroupId: e.target.value || null,
                                })
                              }
                            >
                              <option value="">— Classe —</option>
                              {compatible.map((c) => {
                                const available = c.capacity - c.studentCount;
                                return (
                                  <option key={c.id} value={c.id} disabled={available < 1}>
                                    {c.label} ({c.studentCount}/{c.capacity}
                                    {available < 1 ? ' — complet' : ''})
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <textarea
                          className="w-full min-h-[40px] rounded-md border border-input bg-background p-2 text-xs disabled:opacity-60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                          rows={2}
                          value={r.observation ?? ''}
                          disabled={locked}
                          onChange={(e) =>
                            updateRow(r.studentId, { observation: e.target.value })
                          }
                          placeholder="Observation..."
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {!locked && (
            <div className="no-print flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                <Save className="h-3.5 w-3.5" />
                {isSaving ? 'Enregistrement...' : 'Enregistrer les décisions'}
              </Button>
              <Button
                onClick={() => setApplyOpen(true)}
                disabled={data.decisionCounts.EN_ATTENTE > 0}
                title={
                  data.decisionCounts.EN_ATTENTE > 0
                    ? 'Traitez tous les élèves en attente avant d\'appliquer'
                    : ''
                }
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Appliquer les passages
              </Button>
            </div>
          )}
        </>
      )}

      {!data && !isPending && (
        <div className="rounded-lg border border-dashed bg-muted/20 py-16 text-center text-sm text-muted-foreground">
          Sélectionnez une classe, puis cliquez sur « Charger ».
        </div>
      )}

      {applyOpen && data && (
        <TransitionApplyDialog
          open={applyOpen}
          onClose={() => setApplyOpen(false)}
          classGroupId={classId}
          data={data}
          onApplied={handleApplied}
        />
      )}
    </div>
  );
}

function SummaryPanel({ data }: { data: TransitionData }) {
  const passageRate =
    data.totalStudents > 0
      ? Math.round((data.decisionCounts.PASSAGE / data.totalStudents) * 100)
      : 0;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold">{data.classLabel}</span>
        <span className="text-muted-foreground">Niveau : {data.levelLabel}</span>
        <span className="text-muted-foreground">Année : {data.academicYearLabel}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-md border bg-muted/30 p-2">
          <div className="text-[10px] uppercase text-muted-foreground">Élèves</div>
          <div className="text-lg font-bold">{data.totalStudents}</div>
        </div>
        <div className="rounded-md border bg-emerald-50 p-2">
          <div className="text-[10px] uppercase text-emerald-700">Passages</div>
          <div className="text-lg font-bold text-emerald-900">{data.decisionCounts.PASSAGE}</div>
        </div>
        <div className="rounded-md border bg-orange-50 p-2">
          <div className="text-[10px] uppercase text-orange-700">Redoublements</div>
          <div className="text-lg font-bold text-orange-900">{data.decisionCounts.REDOUBLEMENT}</div>
        </div>
        <div className="rounded-md border bg-red-50 p-2">
          <div className="text-[10px] uppercase text-red-700">Départs</div>
          <div className="text-lg font-bold text-red-900">{data.decisionCounts.DEPART}</div>
        </div>
        <div className="rounded-md border bg-muted/30 p-2">
          <div className="text-[10px] uppercase text-muted-foreground">Taux passage</div>
          <div className="text-lg font-bold">{passageRate}%</div>
        </div>
      </div>
      {data.decisionCounts.EN_ATTENTE > 0 && (
        <div className="mt-2 flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 p-2 text-xs text-orange-800">
          <AlertTriangle className="h-3.5 w-3.5" />
          {data.decisionCounts.EN_ATTENTE} élève(s) sans décision — le bouton « Appliquer » reste désactivé.
        </div>
      )}
    </div>
  );
}
