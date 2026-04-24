'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  getAttendanceExport,
  type AttendanceHistoryFilters,
} from '@/server/actions/attendance';
import { TIME_SLOT_LABELS } from '@/lib/time-slots';
import { formatDateFR } from '@/lib/formatters';

interface AttendanceExportProps {
  filters: AttendanceHistoryFilters;
}

function csvEscape(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Présent',
  ABSENT: 'Absent',
  RETARD: 'Retard',
  EXCUSE: 'Excusé',
};

export function AttendanceExport({ filters }: AttendanceExportProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const rows = await getAttendanceExport(filters);
      if (rows.length === 0) {
        toast.info('Aucune donnée à exporter avec ces filtres.');
        return;
      }

      const header = [
        'Date',
        'Classe',
        'Matricule',
        'Nom',
        'Prénom',
        'Créneau',
        'Statut',
        'Motif',
      ];
      const body = rows.map((r) =>
        [
          formatDateFR(r.date),
          r.classLabel,
          r.matricule,
          r.lastName,
          r.firstName,
          TIME_SLOT_LABELS[r.timeSlot] ?? r.timeSlot,
          STATUS_LABELS[r.status] ?? r.status,
          r.reason,
        ]
          .map((v) => csvEscape(String(v ?? '')))
          .join(','),
      );
      const csv = '\uFEFF' + [header.join(','), ...body].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appels_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${rows.length} ligne(s) exportée(s).`);
    } catch {
      toast.error("Échec de l'export.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={exporting}>
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Exporter CSV
    </Button>
  );
}
