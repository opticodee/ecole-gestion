'use client';

import Link from 'next/link';
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import type { AttendanceStats } from '@/server/actions/attendance';
import { ABSENCE_ALERT_THRESHOLD } from '@/lib/constants.client';
import { cn } from '@/lib/utils';

interface AttendanceStatsProps {
  stats: AttendanceStats;
}

function rateColor(rate: number) {
  if (rate >= 90) return 'bg-green-500';
  if (rate >= 75) return 'bg-amber-500';
  return 'bg-red-500';
}

function rateText(rate: number) {
  if (rate >= 90) return 'text-green-600';
  if (rate >= 75) return 'text-amber-600';
  return 'text-red-600';
}

export function AttendanceStats({ stats }: AttendanceStatsProps) {
  const { totals, topAbsences, perClass } = stats;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Taux de présence
                </p>
                <p className={cn('mt-1 text-3xl font-bold', rateText(totals.presenceRate))}>
                  {totals.presenceRate}%
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full', rateColor(totals.presenceRate))}
                    style={{ width: `${totals.presenceRate}%` }}
                  />
                </div>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Présences
                </p>
                <p className="mt-1 text-3xl font-bold text-green-600">
                  {totals.present}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  sur {totals.present + totals.absent + totals.retard} entrées
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Absences
                </p>
                <p className="mt-1 text-3xl font-bold text-red-600">
                  {totals.absent}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {totals.sessions} séance(s) saisie(s)
                </p>
              </div>
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Retards
                </p>
                <p className="mt-1 text-3xl font-bold text-amber-600">
                  {totals.retard}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {totals.expectedSessions} créneau(x) prévu(s)
                </p>
              </div>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Top 5 des absences
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topAbsences.length === 0 ? (
              <EmptyState message="Aucune absence enregistrée." />
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Élève</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead className="text-center">Abs.</TableHead>
                      <TableHead className="text-center">Ret.</TableHead>
                      <TableHead className="text-center">Présence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topAbsences.map((a) => (
                      <TableRow key={a.studentId}>
                        <TableCell>
                          <Link
                            href={`/admin/vie-scolaire/eleves/${a.studentId}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {a.lastName} {a.firstName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs">
                          {a.classLabel}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              'inline-flex min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold',
                              a.absent >= ABSENCE_ALERT_THRESHOLD
                                ? 'bg-red-100 text-red-700'
                                : 'bg-muted text-foreground',
                            )}
                          >
                            {a.absent}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {a.retard}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-center text-xs font-semibold',
                            rateText(a.presenceRate),
                          )}
                        >
                          {a.presenceRate}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Résumé par classe
            </CardTitle>
          </CardHeader>
          <CardContent>
            {perClass.length === 0 ? (
              <EmptyState message="Aucune donnée par classe." />
            ) : (
              <div className="space-y-3">
                {perClass.map((c) => (
                  <div key={c.classGroupId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{c.classLabel}</span>
                      <span className={cn('text-xs font-semibold', rateText(c.presenceRate))}>
                        {c.presenceRate}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('h-full transition-all', rateColor(c.presenceRate))}
                        style={{ width: `${c.presenceRate}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {c.sessions} séance(s) · {c.absent} absence(s) · {c.retard} retard(s)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
