'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileDown,
  FileText,
  Loader2,
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
import {
  MENTION_COLORS,
  MENTION_LABELS,
  SAISIE_PERIODS,
  formatAverage,
} from '@/lib/bulletin';
import { cn } from '@/lib/utils';
import {
  getBulletinsData,
  type BulletinStudent,
  type BulletinsSummary,
} from '@/server/actions/bulletins';
import type { GradesSummaryOptions } from '@/server/actions/grades-summary';
import { BulletinPreview } from './bulletin-preview';
import { generateBulletinPDF } from './bulletin-pdf';

interface Props {
  options: GradesSummaryOptions;
}

export function BulletinsView({ options }: Props) {
  const [classId, setClassId] = useState<string>(options.classes[0]?.id ?? '');
  const [period, setPeriod] = useState<number>(1);
  const [data, setData] = useState<BulletinsSummary | null>(null);
  const [isPending, startTransition] = useTransition();
  const [previewStudent, setPreviewStudent] = useState<BulletinStudent | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  function handleGenerate() {
    if (!classId) {
      toast.error('Veuillez sélectionner une classe.');
      return;
    }
    startTransition(async () => {
      const result = await getBulletinsData(classId, period);
      if (result.error) {
        toast.error(result.error);
        setData(null);
        return;
      }
      setData(result.data ?? null);
    });
  }

  async function downloadOne(student: BulletinStudent) {
    if (!data) return;
    const filename = `bulletin-${student.lastName}-${student.firstName}-T${data.context.period}.pdf`
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-');
    await generateBulletinPDF(data.context, [student], filename);
    toast.success('PDF généré.');
  }

  async function downloadAll() {
    if (!data) return;
    setBulkGenerating(true);
    const filename = `bulletins-${data.context.classLabel}-T${data.context.period}.pdf`
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-');
    await generateBulletinPDF(data.context, data.bulletins, filename);
    setBulkGenerating(false);
    toast.success(`${data.bulletins.length} bulletin(s) générés.`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Bulletins</h1>
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
        <Button onClick={handleGenerate} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Générer les bulletins
        </Button>
      </div>

      {data && <ReadinessPanel data={data} />}

      {data && data.bulletins.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {data.bulletins.length} bulletin(s) pour {data.context.classLabel}
            </div>
            <Button onClick={downloadAll} disabled={bulkGenerating}>
              {bulkGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Télécharger tous les bulletins
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead>Élève</TableHead>
                  <TableHead className="text-center">Moyenne</TableHead>
                  <TableHead className="text-center">Rang</TableHead>
                  <TableHead>Mention</TableHead>
                  <TableHead className="max-w-[20rem]">Appréciation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.bulletins.map((b) => (
                  <TableRow key={b.studentId}>
                    <TableCell className="font-medium">
                      {b.lastName.toUpperCase()} {b.firstName}
                      <div className="text-[10px] text-muted-foreground">{b.matricule}</div>
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {formatAverage(b.overallAverage)}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {b.overallAverage === null ? '—' : `${b.rank} / ${b.totalStudents}`}
                    </TableCell>
                    <TableCell>
                      {b.effectiveMention ? (
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                            MENTION_COLORS[b.effectiveMention],
                          )}
                        >
                          {MENTION_LABELS[b.effectiveMention]}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[20rem] truncate text-xs text-muted-foreground">
                      {b.generalComment || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewStudent(b)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Aperçu
                        </Button>
                        <Button size="sm" onClick={() => downloadOne(b)}>
                          <FileDown className="h-3.5 w-3.5" />
                          PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {!data && !isPending && (
        <div className="rounded-lg border border-dashed bg-muted/20 py-16 text-center text-sm text-muted-foreground">
          Sélectionnez une classe et un trimestre, puis cliquez sur « Générer les bulletins ».
        </div>
      )}

      {data && previewStudent && (
        <BulletinPreview
          open={!!previewStudent}
          onClose={() => setPreviewStudent(null)}
          context={data.context}
          student={previewStudent}
        />
      )}
    </div>
  );
}

function ReadinessPanel({ data }: { data: BulletinsSummary }) {
  const { readiness } = data;
  const notesReady = readiness.totalEvaluations > 0 && readiness.lockedEvaluations === readiness.totalEvaluations;
  const apprReady = readiness.studentsWithAppreciation === readiness.totalStudents;
  const mentionReady = readiness.studentsWithMention === readiness.totalStudents;
  const allReady = notesReady && apprReady && mentionReady && readiness.totalEvaluations > 0;

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        allReady ? 'border-emerald-200 bg-emerald-50' : 'border-orange-200 bg-orange-50',
      )}
    >
      <div className="flex items-start gap-2">
        {allReady ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
        )}
        <div className="flex-1 space-y-1 text-sm">
          <p className="font-semibold">
            {allReady
              ? 'Toutes les données sont prêtes pour la génération des bulletins.'
              : 'Certaines données sont manquantes — les bulletins peuvent être partiels.'}
          </p>
          <ul className="space-y-0.5 text-xs">
            <li className={notesReady ? 'text-emerald-700' : 'text-orange-700'}>
              {notesReady ? '✅' : '❌'} Notes : {readiness.lockedEvaluations}/{readiness.totalEvaluations} évaluation(s) verrouillées
              {!notesReady && (
                <Link
                  href="/admin/vie-scolaire/evaluations"
                  className="ml-2 underline"
                >
                  → Compléter
                </Link>
              )}
            </li>
            <li className={apprReady ? 'text-emerald-700' : 'text-orange-700'}>
              {apprReady ? '✅' : '❌'} Appréciations : {readiness.studentsWithAppreciation}/{readiness.totalStudents} élèves
              {!apprReady && (
                <Link
                  href="/admin/vie-scolaire/appreciations"
                  className="ml-2 underline"
                >
                  → Compléter
                </Link>
              )}
            </li>
            <li className={mentionReady ? 'text-emerald-700' : 'text-orange-700'}>
              {mentionReady ? '✅' : '❌'} Mentions : {readiness.studentsWithMention}/{readiness.totalStudents} élèves
              {!mentionReady && (
                <Link
                  href="/admin/vie-scolaire/mentions"
                  className="ml-2 underline"
                >
                  → Compléter
                </Link>
              )}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
