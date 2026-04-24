'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { averageBgColor, formatAverage, scoreColor } from '@/lib/bulletin';
import { cn } from '@/lib/utils';
import { formatDateFR } from '@/lib/formatters';
import type { GradesSummary } from '@/server/actions/grades-summary';

export function GradesSummaryStudentView({ summary }: { summary: GradesSummary }) {
  const { subjects, rows } = summary;
  const [studentId, setStudentId] = useState<string>(rows[0]?.studentId ?? '');

  const student = rows.find((r) => r.studentId === studentId);
  const studentsSorted = [...rows].sort((a, b) =>
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'fr'),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Élève</label>
          <Select
            value={studentId}
            onValueChange={(v) => setStudentId(v ?? '')}
            items={studentsSorted.map((s) => ({
              value: s.studentId,
              label: `${s.lastName.toUpperCase()} ${s.firstName}`,
            }))}
          >
            <SelectTrigger className="w-full sm:w-96">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {studentsSorted.map((s) => (
                <SelectItem key={s.studentId} value={s.studentId}>
                  {s.lastName.toUpperCase()} {s.firstName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {student ? (
        <div className="space-y-4">
          <div className={cn('rounded-lg border bg-card p-4', averageBgColor(student.overallAverage))}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <Link
                  href={`/admin/vie-scolaire/eleves/${student.studentId}`}
                  className="text-lg font-bold hover:underline"
                >
                  {student.lastName.toUpperCase()} {student.firstName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {student.matricule} · {summary.classLabel} · {summary.periodLabel}
                </p>
              </div>
              <div className="flex gap-6">
                <div>
                  <div className="text-xs text-muted-foreground">Moyenne générale</div>
                  <div className="text-2xl font-bold">{formatAverage(student.overallAverage)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Rang</div>
                  <div className="text-2xl font-bold">
                    {student.overallAverage === null ? '—' : `${student.rank}/${rows.length}`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead>Matière</TableHead>
                  <TableHead>Évaluation</TableHead>
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">Coef.</TableHead>
                  <TableHead className="text-center">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      Aucune évaluation sur la période.
                    </TableCell>
                  </TableRow>
                ) : (
                  subjects.map((subj) => (
                    <Fragment key={subj.subjectId}>
                      {subj.evaluations.map((col, idx) => {
                        const g = student.grades[col.evaluationId];
                        return (
                          <TableRow key={col.evaluationId}>
                            {idx === 0 && (
                              <TableCell rowSpan={subj.evaluations.length + 1} className="font-semibold align-top">
                                {subj.subjectLabel}
                              </TableCell>
                            )}
                            <TableCell className="text-xs">{col.fullLabel}</TableCell>
                            <TableCell className="text-center text-xs">{formatDateFR(col.date)}</TableCell>
                            <TableCell className="text-center text-xs">{col.type === 'EXAMEN' ? 'Examen' : 'Contrôle'}</TableCell>
                            <TableCell className="text-center text-xs">{col.coefficient}</TableCell>
                            <TableCell
                              className={cn(
                                'text-center font-medium',
                                g?.isAbsent ? 'italic text-muted-foreground' : scoreColor(g?.score ?? null),
                              )}
                            >
                              {g?.isAbsent
                                ? 'Absent'
                                : g?.score !== null && g?.score !== undefined
                                  ? `${g.score.toFixed(1)} / ${col.scale}`
                                  : '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-primary/5">
                        <TableCell colSpan={4} className="text-right text-xs font-semibold text-muted-foreground">
                          Moyenne matière
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {formatAverage(student.subjectAverages[subj.subjectId])}
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          Sélectionnez un élève.
        </div>
      )}
    </div>
  );
}
