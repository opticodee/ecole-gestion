'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, ChevronDown, Lock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  ACADEMIC_YEAR_STATUS_COLORS,
  ACADEMIC_YEAR_STATUS_LABELS,
} from '@/lib/academic-year';
import { listAcademicYearsForHeader } from '@/server/actions/academic-years';

type Year = Awaited<ReturnType<typeof listAcademicYearsForHeader>>[number];

export function YearSwitcher() {
  const params = useSearchParams();
  const viewYearId = params.get('year');
  const [years, setYears] = useState<Year[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await listAcademicYearsForHeader();
      if (!cancelled) setYears(result);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const active = years.find((y) => y.status === 'ACTIVE') ?? null;
  const viewed = viewYearId ? years.find((y) => y.id === viewYearId) : null;
  const current = viewed ?? active;
  const isArchive = !!viewed && viewed.status !== 'ACTIVE';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-muted focus:outline-none">
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
        {current ? (
          <>
            <span>{current.label}</span>
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-1.5 py-0 text-[9px] font-medium',
                ACADEMIC_YEAR_STATUS_COLORS[current.status].badge,
              )}
            >
              {isArchive ? (
                <>
                  <Lock className="mr-0.5 h-2.5 w-2.5" />
                  Archives
                </>
              ) : (
                ACADEMIC_YEAR_STATUS_LABELS[current.status]
              )}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">Aucune année</span>
        )}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Année en cours
        </div>
        {active ? (
          <DropdownMenuItem
            render={<Link href="?year=" />}
            className={cn(!viewed && 'bg-primary/10')}
          >
            <span className="flex-1 font-medium">{active.label}</span>
            <span
              className={cn(
                'rounded-full border px-1.5 py-0 text-[9px] font-medium',
                ACADEMIC_YEAR_STATUS_COLORS.ACTIVE.badge,
              )}
            >
              Active
            </span>
          </DropdownMenuItem>
        ) : (
          <div className="px-2 py-1 text-[10px] italic text-muted-foreground">
            Aucune année active
          </div>
        )}

        {years.some((y) => y.status === 'CLOTUREE') && (
          <>
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Archives (lecture seule)
            </div>
            {years
              .filter((y) => y.status === 'CLOTUREE')
              .map((y) => (
                <DropdownMenuItem
                  key={y.id}
                  render={<Link href={`?year=${y.id}`} />}
                  className={cn(viewed?.id === y.id && 'bg-primary/10')}
                >
                  <span className="flex-1">{y.label}</span>
                  <span
                    className={cn(
                      'rounded-full border px-1.5 py-0 text-[9px] font-medium',
                      ACADEMIC_YEAR_STATUS_COLORS.CLOTUREE.badge,
                    )}
                  >
                    Clôturée
                  </span>
                </DropdownMenuItem>
              ))}
          </>
        )}

        {years.some((y) => y.status === 'BROUILLON') && (
          <>
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Brouillons
            </div>
            {years
              .filter((y) => y.status === 'BROUILLON')
              .map((y) => (
                <DropdownMenuItem
                  key={y.id}
                  render={
                    <Link href={`/admin/vie-scolaire/annee-scolaire`} />
                  }
                >
                  <span className="flex-1">{y.label}</span>
                  <span
                    className={cn(
                      'rounded-full border px-1.5 py-0 text-[9px] font-medium',
                      ACADEMIC_YEAR_STATUS_COLORS.BROUILLON.badge,
                    )}
                  >
                    Brouillon
                  </span>
                </DropdownMenuItem>
              ))}
          </>
        )}

        <div className="border-t px-2 py-1 text-[10px] text-muted-foreground">
          <Link
            href="/admin/vie-scolaire/annee-scolaire"
            className="hover:underline"
          >
            Gérer les années →
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ArchiveBanner() {
  const params = useSearchParams();
  const viewYearId = params.get('year');
  const [viewed, setViewed] = useState<Year | null>(null);

  useEffect(() => {
    if (!viewYearId) {
      setViewed(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const list = await listAcademicYearsForHeader();
      if (cancelled) return;
      setViewed(list.find((y) => y.id === viewYearId) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [viewYearId]);

  if (!viewed || viewed.status === 'ACTIVE') return null;

  return (
    <div className="no-print border-b border-yellow-400/40 bg-yellow-100 px-4 py-2 text-xs text-yellow-900 dark:bg-yellow-500/10 dark:text-yellow-200">
      <strong>Mode archives :</strong> vous consultez les données de l&apos;année{' '}
      <strong>{viewed.label}</strong>. Les données sont en lecture seule.{' '}
      <Link href="?year=" className="underline">
        Revenir à l&apos;année active
      </Link>
    </div>
  );
}
