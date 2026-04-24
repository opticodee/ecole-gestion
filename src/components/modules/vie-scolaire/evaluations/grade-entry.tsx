'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Lock, Save, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { saveGrades } from '@/server/actions/grades';
import { formatDateFR } from '@/lib/formatters';
import type { EvaluationDetail } from '@/server/actions/evaluations';
import { GradeStats } from './grade-stats';

const TYPE_LABELS: Record<string, string> = {
  CONTROLE: 'Contrôle',
  EXAMEN: 'Examen',
};

interface GradeRow {
  studentId: string;
  studentName: string;
  matricule: string;
  score: string; // champ contrôlé (string pour le champ input)
  isAbsent: boolean;
}

export function GradeEntry({ evaluation }: { evaluation: EvaluationDetail }) {
  const router = useRouter();
  const [rows, setRows] = useState<GradeRow[]>(() =>
    evaluation.students.map((s) => {
      const g = evaluation.grades.find((x) => x.studentId === s.id);
      return {
        studentId: s.id,
        studentName: `${s.lastName.toUpperCase()} ${s.firstName}`,
        matricule: s.matricule,
        score: g?.score !== null && g?.score !== undefined ? String(g.score) : '',
        isAbsent: g?.isAbsent ?? false,
      };
    }),
  );
  const [confirmLock, setConfirmLock] = useState(false);
  const [saving, setSaving] = useState(false);

  const locked = evaluation.isLocked;

  const numericScores = useMemo(() => {
    return rows
      .filter((r) => !r.isAbsent && r.score.trim() !== '')
      .map((r) => Number(r.score))
      .filter((n) => Number.isFinite(n));
  }, [rows]);

  const absentCount = rows.filter((r) => r.isAbsent).length;

  function updateRow(id: string, patch: Partial<GradeRow>) {
    setRows((prev) =>
      prev.map((r) => (r.studentId === id ? { ...r, ...patch } : r)),
    );
  }

  function validateRows(requireComplete: boolean): { ok: boolean; message?: string } {
    for (const r of rows) {
      if (r.isAbsent) continue;
      if (r.score.trim() === '') {
        if (requireComplete) {
          return { ok: false, message: `Note manquante pour ${r.studentName}.` };
        }
        continue;
      }
      const n = Number(r.score);
      if (!Number.isFinite(n)) {
        return { ok: false, message: `Note invalide pour ${r.studentName}.` };
      }
      if (n < 0 || n > evaluation.scale) {
        return {
          ok: false,
          message: `Note hors barème (0 — ${evaluation.scale}) pour ${r.studentName}.`,
        };
      }
    }
    return { ok: true };
  }

  async function handleSave(lock: boolean) {
    const validation = validateRows(lock);
    if (!validation.ok) {
      toast.error(validation.message!);
      return;
    }

    setSaving(true);
    const payload = {
      evaluationId: evaluation.id,
      lock,
      grades: rows.map((r) => ({
        studentId: r.studentId,
        isAbsent: r.isAbsent,
        score:
          r.isAbsent || r.score.trim() === '' ? null : Number(r.score),
      })),
    };

    const result = await saveGrades(payload);
    setSaving(false);

    if ('error' in result && result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(lock ? 'Notes verrouillées.' : 'Notes enregistrées en brouillon.');
    setConfirmLock(false);
    router.refresh();
  }

  async function exportCsv() {
    const Papa = (await import('papaparse')).default;
    const data = rows.map((r) => ({
      Matricule: r.matricule,
      Élève: r.studentName,
      Absent: r.isAbsent ? 'Oui' : 'Non',
      Note: r.isAbsent ? '' : r.score,
      Barème: evaluation.scale,
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-${evaluation.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/vie-scolaire/evaluations"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Retour aux évaluations
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-foreground">
            {evaluation.label}
            {locked && (
              <span className="ml-3 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 align-middle text-xs font-medium text-amber-800">
                <Lock className="h-3 w-3" />
                Verrouillé
              </span>
            )}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {evaluation.classLabel} · {evaluation.subjectLabel}
            {evaluation.subSubjectLabel && ` › ${evaluation.subSubjectLabel}`} ·{' '}
            {TYPE_LABELS[evaluation.evaluationType]} · Coef. {evaluation.coefficient} ·
            Barème /{evaluation.scale} · {formatDateFR(evaluation.date)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <FileText className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          {!locked && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={saving}>
                <Save className="h-3.5 w-3.5" />
                Enregistrer brouillon
              </Button>
              <Button size="sm" onClick={() => setConfirmLock(true)} disabled={saving}>
                <ShieldCheck className="h-3.5 w-3.5" />
                Valider et verrouiller
              </Button>
            </>
          )}
        </div>
      </div>

      <GradeStats
        scores={numericScores}
        absents={absentCount}
        totalStudents={rows.length}
        scale={evaluation.scale}
      />

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/5">
              <TableHead className="w-32">Matricule</TableHead>
              <TableHead>Élève</TableHead>
              <TableHead className="w-40">Note (/{evaluation.scale})</TableHead>
              <TableHead className="w-24 text-center">Absent(e)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  Aucun élève dans cette classe.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.studentId}>
                  <TableCell className="font-mono text-xs">{r.matricule}</TableCell>
                  <TableCell className="font-medium">{r.studentName}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step={0.25}
                      min={0}
                      max={evaluation.scale}
                      value={r.score}
                      onChange={(e) =>
                        updateRow(r.studentId, { score: e.target.value, isAbsent: false })
                      }
                      disabled={locked || r.isAbsent}
                      placeholder={r.isAbsent ? '—' : '0'}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={r.isAbsent}
                      onChange={(e) =>
                        updateRow(r.studentId, {
                          isAbsent: e.target.checked,
                          score: e.target.checked ? '' : r.score,
                        })
                      }
                      disabled={locked}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={confirmLock} onOpenChange={setConfirmLock}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verrouiller les notes ?</AlertDialogTitle>
            <AlertDialogDescription>
              Une fois verrouillée, l&apos;évaluation ne pourra plus être modifiée ni
              supprimée. Assurez-vous que toutes les notes sont correctes avant de
              confirmer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirmLock(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving}>
              {saving ? 'Verrouillage...' : 'Valider et verrouiller'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
