'use client';

import { useEffect, useState } from 'react';
import { Loader2, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getAttendanceDetail,
  type AttendanceDetail,
} from '@/server/actions/attendance';
import { TIME_SLOT_LABELS } from '@/lib/time-slots';
import { formatDateFR } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface AttendanceDetailModalProps {
  open: boolean;
  onClose: () => void;
  classGroupId: string;
  dateISO: string;
}

function statusLabel(s: AttendanceDetail['entries'][number]['status']) {
  if (s === 'PRESENT') return { label: 'Présent', cls: 'bg-green-100 text-green-700 border-green-200' };
  if (s === 'ABSENT') return { label: 'Absent', cls: 'bg-red-100 text-red-700 border-red-200' };
  if (s === 'RETARD') return { label: 'Retard', cls: 'bg-amber-100 text-amber-700 border-amber-200' };
  return { label: 'Excusé', cls: 'bg-blue-100 text-blue-700 border-blue-200' };
}

export function AttendanceDetailModal({
  open,
  onClose,
  classGroupId,
  dateISO,
}: AttendanceDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AttendanceDetail | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const d = await getAttendanceDetail(classGroupId, dateISO);
      if (!cancelled) {
        setDetail(d);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, classGroupId, dateISO]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Détail de l&apos;appel
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !detail ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucun détail disponible.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Classe</p>
                <p className="font-medium">{detail.classLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Niveau</p>
                <p className="font-medium">{detail.levelLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Professeur</p>
                <p className="font-medium">
                  {detail.teacherName || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date · créneau</p>
                <p className="font-medium">
                  {formatDateFR(detail.date)}
                  {detail.timeSlot
                    ? ` · ${TIME_SLOT_LABELS[detail.timeSlot]}`
                    : ''}
                </p>
              </div>
            </div>

            {detail.entries.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucun élève enregistré pour cette séance.
              </p>
            ) : (
              <div className="max-h-[55vh] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Élève</TableHead>
                      <TableHead>Matricule</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Motif</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.entries.map((e) => {
                      const badge = statusLabel(e.status);
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">
                            {e.lastName} {e.firstName}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {e.matricule}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                                badge.cls,
                              )}
                            >
                              {badge.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {e.reason || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
