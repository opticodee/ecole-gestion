'use client';

import { FileDown, Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  formatAverage,
  scoreColor,
} from '@/lib/bulletin';
import { cn } from '@/lib/utils';
import { formatDateFR } from '@/lib/formatters';
import type {
  BulletinClassContext,
  BulletinStudent,
} from '@/server/actions/bulletins';
import { generateBulletinPDF } from './bulletin-pdf';

interface Props {
  open: boolean;
  onClose: () => void;
  context: BulletinClassContext;
  student: BulletinStudent;
}

export function BulletinPreview({ open, onClose, context, student }: Props) {
  if (!open) return null;

  async function downloadPdf() {
    const filename = `bulletin-${student.lastName}-${student.firstName}-T${context.period}.pdf`
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-');
    await generateBulletinPDF(context, [student], filename);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:static print:bg-white print:p-0">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-2xl print:max-h-full print:shadow-none">
        <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-3">
          <h2 className="text-base font-semibold">
            Aperçu bulletin — {student.lastName.toUpperCase()} {student.firstName}
          </h2>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={downloadPdf}>
              <FileDown className="h-3.5 w-3.5" />
              Télécharger PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" />
              Imprimer
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <BulletinDocument context={context} student={student} />
      </div>
    </div>
  );
}

export function BulletinDocument({
  context,
  student,
}: {
  context: BulletinClassContext;
  student: BulletinStudent;
}) {
  return (
    <div className="bulletin-document mx-auto max-w-[210mm] bg-white p-8 text-sm text-slate-900 print:p-10">
      <div className="-mx-8 -mt-8 mb-4 bg-emerald-700 px-8 py-2 text-white print:-mx-10 print:-mt-10 print:px-10">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">{context.schoolName}</div>
          <div className="text-xs">
            Année {context.academicYearLabel} — Trimestre {context.period}
          </div>
        </div>
      </div>
      <h1 className="text-center text-xl font-bold uppercase tracking-wide">Bulletin scolaire</h1>

      <div className="my-4 grid grid-cols-2 gap-3 rounded border border-slate-300 p-3 text-xs">
        <div>
          <div className="font-semibold">
            Élève : {student.lastName.toUpperCase()} {student.firstName}
          </div>
          <div className="text-slate-600">Matricule : {student.matricule}</div>
          <div className="text-slate-600">Classe : {context.classLabel}</div>
        </div>
        <div>
          <div>Niveau : {context.levelLabel}</div>
          <div>Professeur : {context.mainTeacherName ?? '—'}</div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-emerald-50">
            <TableHead className="w-1/4">Matière</TableHead>
            <TableHead>Évaluations</TableHead>
            <TableHead className="w-20 text-center">Coef.</TableHead>
            <TableHead className="w-24 text-center">Moyenne</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {student.subjects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-6 text-center text-xs text-slate-500">
                Aucune évaluation sur la période.
              </TableCell>
            </TableRow>
          ) : (
            student.subjects.map((subj) => (
              <TableRow key={subj.subjectId}>
                <TableCell className="font-semibold">{subj.subjectLabel}</TableCell>
                <TableCell className="text-xs">
                  <ul className="space-y-0.5">
                    {subj.evaluations.map((e) => (
                      <li key={e.evaluationId}>
                        <span className="mr-1 inline-block rounded bg-slate-100 px-1 text-[10px] text-slate-600">
                          {e.type === 'EXAMEN' ? 'Ex.' : 'Ct.'} {formatDateFR(e.date)}
                        </span>
                        {e.isAbsent ? (
                          <span className="italic text-slate-500">Absent</span>
                        ) : e.score !== null ? (
                          <span className={scoreColor(e.score)}>
                            {e.score.toFixed(1)} / {e.scale}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell className="text-center text-xs">
                  {subj.evaluations.map((e) => e.coefficient).join(' / ')}
                </TableCell>
                <TableCell className="text-center font-bold">
                  {formatAverage(subj.average)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="mt-4 grid grid-cols-3 gap-3 rounded border border-slate-300 bg-emerald-50 p-3 text-center text-sm">
        <div>
          <div className="text-[10px] uppercase text-slate-600">Moy. Générale</div>
          <div className="text-lg font-bold">{formatAverage(student.overallAverage)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-600">Rang</div>
          <div className="text-lg font-bold">
            {student.overallAverage === null ? '—' : `${student.rank} / ${student.totalStudents}`}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-600">Moy. Classe</div>
          <div className="text-lg font-bold">{formatAverage(student.classAverage)}</div>
        </div>
      </div>

      {student.effectiveMention && (
        <div className="mt-3 flex items-center justify-center">
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-4 py-1 text-sm font-bold',
              MENTION_COLORS[student.effectiveMention],
            )}
          >
            Mention : {MENTION_LABELS[student.effectiveMention]}
          </span>
        </div>
      )}

      {student.generalComment && (
        <div className="mt-4 rounded border border-slate-300 p-3">
          <div className="text-xs font-semibold uppercase text-slate-600">Appréciation générale</div>
          <p className="mt-1 text-sm">{student.generalComment}</p>
        </div>
      )}

      {Object.keys(student.subjectComments).length > 0 && (
        <div className="mt-3 rounded border border-slate-300 p-3">
          <div className="text-xs font-semibold uppercase text-slate-600">Appréciations par matière</div>
          <ul className="mt-1 space-y-1 text-xs">
            {student.subjects.map((subj) => {
              const comment = student.subjectComments[subj.subjectId];
              if (!comment) return null;
              return (
                <li key={subj.subjectId}>
                  <span className="font-semibold">{subj.subjectLabel} : </span>
                  {comment}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {student.councilComment && (
        <div className="mt-3 rounded border border-slate-300 p-3">
          <div className="text-xs font-semibold uppercase text-slate-600">Commentaire du conseil</div>
          <p className="mt-1 text-sm italic">{student.councilComment}</p>
        </div>
      )}

      <div className="mt-6 flex items-end justify-between border-t pt-3 text-xs text-slate-600">
        <div>Généré le {formatDateFR(new Date(context.generatedAt))}</div>
        <div>Signature : ____________________________</div>
      </div>
    </div>
  );
}
