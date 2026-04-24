'use client';

import Link from 'next/link';
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
import type { GradesSummary } from '@/server/actions/grades-summary';

interface Props {
  summary: GradesSummary;
}

export function GradesSummaryClassView({ summary }: Props) {
  const { subjects, rows, classSubjectAverages, classSubjectMax, classSubjectMin, classOverallAverage } = summary;

  const totalCols =
    1 + // student
    subjects.reduce((acc, s) => acc + s.evaluations.length + 1, 0) + // evals + avg
    2; // overall + rank

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
          <span className="font-semibold">{summary.classLabel}</span>
          <span className="text-muted-foreground">Niveau : {summary.levelLabel}</span>
          {summary.mainTeacherName && (
            <span className="text-muted-foreground">Prof : {summary.mainTeacherName}</span>
          )}
          <span className="text-muted-foreground">Année : {summary.academicYearLabel}</span>
          <span className="text-muted-foreground">Période : {summary.periodLabel}</span>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          Aucune évaluation trouvée pour cette classe sur la période sélectionnée.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead rowSpan={2} className="sticky left-0 z-10 bg-primary/5 align-bottom">
                  Élève
                </TableHead>
                {subjects.map((subj) => (
                  <TableHead
                    key={subj.subjectId}
                    colSpan={subj.evaluations.length + 1}
                    className="border-l text-center"
                  >
                    {subj.subjectLabel}
                  </TableHead>
                ))}
                <TableHead rowSpan={2} className="border-l text-center align-bottom">
                  Moy. Générale
                </TableHead>
                <TableHead rowSpan={2} className="text-center align-bottom">
                  Rang
                </TableHead>
              </TableRow>
              <TableRow className="bg-primary/5">
                {subjects.flatMap((subj) => [
                  ...subj.evaluations.map((col) => (
                    <TableHead
                      key={col.evaluationId}
                      className="border-l whitespace-nowrap text-center text-[10px] font-normal"
                      title={`${col.fullLabel} (coef. ${col.coefficient})`}
                    >
                      {col.shortLabel}
                    </TableHead>
                  )),
                  <TableHead
                    key={`${subj.subjectId}-avg`}
                    className="bg-primary/10 text-center text-xs font-semibold"
                  >
                    Moy.
                  </TableHead>,
                ])}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={totalCols} className="py-8 text-center text-sm text-muted-foreground">
                    Aucun élève dans cette classe.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.studentId} className={averageBgColor(r.overallAverage)}>
                    <TableCell className="sticky left-0 z-10 bg-inherit font-medium">
                      <Link
                        href={`/admin/vie-scolaire/eleves/${r.studentId}`}
                        className="hover:underline"
                      >
                        {r.lastName.toUpperCase()} {r.firstName}
                      </Link>
                    </TableCell>
                    {subjects.flatMap((subj) => [
                      ...subj.evaluations.map((col) => {
                        const g = r.grades[col.evaluationId];
                        return (
                          <TableCell
                            key={col.evaluationId}
                            className={cn(
                              'border-l text-center text-xs',
                              g?.isAbsent ? 'italic text-muted-foreground' : scoreColor(g?.score ?? null),
                            )}
                          >
                            {g?.isAbsent ? 'Abs.' : g?.score !== null && g?.score !== undefined ? g.score.toFixed(1) : '—'}
                          </TableCell>
                        );
                      }),
                      <TableCell
                        key={`${subj.subjectId}-avg`}
                        className="bg-primary/5 text-center text-sm font-semibold"
                      >
                        {formatAverage(r.subjectAverages[subj.subjectId])}
                      </TableCell>,
                    ])}
                    <TableCell className="border-l bg-primary/10 text-center text-sm font-bold">
                      {formatAverage(r.overallAverage)}
                    </TableCell>
                    <TableCell className="text-center text-sm font-semibold">
                      {r.overallAverage === null ? '—' : `${r.rank}${r.rank === 1 ? 'er' : 'e'}`}
                    </TableCell>
                  </TableRow>
                ))
              )}

              {/* Summary rows */}
              <TableRow className="border-t-2 bg-muted/40">
                <TableCell className="sticky left-0 z-10 bg-muted/40 font-semibold">
                  Moyenne classe
                </TableCell>
                {subjects.flatMap((subj) => [
                  ...subj.evaluations.map((col) => (
                    <TableCell key={`avg-${col.evaluationId}`} className="border-l" />
                  )),
                  <TableCell
                    key={`avg-${subj.subjectId}`}
                    className="text-center text-xs font-semibold"
                  >
                    {formatAverage(classSubjectAverages[subj.subjectId])}
                  </TableCell>,
                ])}
                <TableCell className="border-l text-center text-sm font-bold">
                  {formatAverage(classOverallAverage)}
                </TableCell>
                <TableCell />
              </TableRow>
              <TableRow className="bg-muted/20">
                <TableCell className="sticky left-0 z-10 bg-muted/20 text-xs">
                  Max. classe
                </TableCell>
                {subjects.flatMap((subj) => [
                  ...subj.evaluations.map((col) => (
                    <TableCell key={`max-${col.evaluationId}`} className="border-l" />
                  )),
                  <TableCell key={`max-${subj.subjectId}`} className="text-center text-xs">
                    {formatAverage(classSubjectMax[subj.subjectId])}
                  </TableCell>,
                ])}
                <TableCell className="border-l" />
                <TableCell />
              </TableRow>
              <TableRow className="bg-muted/20">
                <TableCell className="sticky left-0 z-10 bg-muted/20 text-xs">
                  Min. classe
                </TableCell>
                {subjects.flatMap((subj) => [
                  ...subj.evaluations.map((col) => (
                    <TableCell key={`min-${col.evaluationId}`} className="border-l" />
                  )),
                  <TableCell key={`min-${subj.subjectId}`} className="text-center text-xs">
                    {formatAverage(classSubjectMin[subj.subjectId])}
                  </TableCell>,
                ])}
                <TableCell className="border-l" />
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-300" />
          Note ≥ 8/10
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-orange-100 ring-1 ring-orange-300" />
          Note 5 – 8/10
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-red-100 ring-1 ring-red-300" />
          Note &lt; 5/10
        </span>
      </div>
    </div>
  );
}
