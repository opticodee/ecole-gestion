import Link from 'next/link';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AlertItem {
  studentId: string;
  firstName: string;
  lastName: string;
  classLabel: string;
  count: number;
}

export function AbsenceAlerts({ alerts }: { alerts: AlertItem[] }) {
  return (
    <Card className="border border-border/60 border-l-4 border-l-red-500/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          Alertes absences
          {alerts.length > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white animate-pulse-alert">
              {alerts.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7 opacity-70" />
            <p>Aucune alerte d&apos;absence pour le moment.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.studentId}>
                <Link
                  href={`/admin/vie-scolaire/eleves/${a.studentId}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-red-200/60 bg-red-50 p-2.5 text-sm transition-all hover:border-red-300 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/15"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-red-900 dark:text-red-200">
                      {a.firstName} {a.lastName}
                    </p>
                    <p className="text-xs text-red-700/80 dark:text-red-300/70">
                      {a.classLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-semibold tabular-nums text-red-700 dark:text-red-300">
                      {a.count}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-500/20 dark:text-red-200">
                      Seuil atteint
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
