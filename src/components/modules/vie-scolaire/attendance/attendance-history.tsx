'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Pencil,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { AttendanceFilters, type AttendanceStatusFilter } from './attendance-filters';
import { AttendanceExport } from './attendance-export';
import {
  getAttendanceHistory,
  type AttendanceClassOption,
  type AttendanceHistoryRow,
} from '@/server/actions/attendance';
import { TIME_SLOT_LABELS } from '@/lib/time-slots';
import { formatDateFR } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 15;

interface AttendanceHistoryProps {
  classes: AttendanceClassOption[];
  initialRows: AttendanceHistoryRow[];
  onViewDetail: (classGroupId: string, dateISO: string) => void;
  onEdit: (classGroupId: string, dateISO: string) => void;
  refreshKey: number;
}

export function AttendanceHistory({
  classes,
  initialRows,
  onViewDetail,
  onEdit,
  refreshKey,
}: AttendanceHistoryProps) {
  const [rows, setRows] = useState<AttendanceHistoryRow[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState<AttendanceStatusFilter>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({
      classGroupId: filterClass || undefined,
      statusFilter: filterStatus
        ? (filterStatus as 'WITH_ABSENCES' | 'FULL_PRESENT')
        : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      studentQuery: search.trim() || undefined,
    }),
    [filterClass, filterStatus, dateFrom, dateTo, search],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const next = await getAttendanceHistory(filters);
      if (!cancelled) {
        setRows(next);
        setPage(1);
        setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [filters, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Historique des appels
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({rows.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Rechercher un élève..."
            />
            <AttendanceFilters
              classes={classes}
              filterClass={filterClass}
              onFilterClass={setFilterClass}
              filterStatus={filterStatus}
              onFilterStatus={setFilterStatus}
              dateFrom={dateFrom}
              onDateFrom={setDateFrom}
              dateTo={dateTo}
              onDateTo={setDateTo}
            />
          </div>
          <AttendanceExport filters={filters} />
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Chargement...
          </p>
        ) : rows.length === 0 ? (
          <EmptyState message="Aucun appel trouvé pour ces filtres." />
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/5">
                    <TableHead>Date</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Professeur</TableHead>
                    <TableHead>Créneau</TableHead>
                    <TableHead className="text-center">Présents</TableHead>
                    <TableHead className="text-center">Absents</TableHead>
                    <TableHead className="text-center">Retards</TableHead>
                    <TableHead className="text-center">Taux</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {formatDateFR(r.date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {r.classLabel}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.teacherName || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {TIME_SLOT_LABELS[r.timeSlot]}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          {r.present}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            'inline-flex min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold',
                            r.absent > 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {r.absent}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            'inline-flex min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold',
                            r.retard > 0
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {r.retard}
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-center text-xs font-semibold',
                          r.presenceRate >= 90
                            ? 'text-green-600'
                            : r.presenceRate >= 75
                              ? 'text-amber-600'
                              : 'text-red-600',
                        )}
                      >
                        {r.presenceRate}%
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onViewDetail(r.classGroupId, r.date)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Voir détail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onEdit(r.classGroupId, r.date)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Modifier
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {currentPage} sur {totalPages} — {rows.length} séance(s)
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="px-2 text-xs text-muted-foreground">
                    {currentPage}/{totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
