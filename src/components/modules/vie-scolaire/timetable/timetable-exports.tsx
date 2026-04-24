'use client';

import { FileDown, FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TIME_SLOTS, TIME_SLOT_LABELS } from '@/lib/constants.client';
import { formatDateFR } from '@/lib/formatters';
import type {
  TimetableClassCell,
  TimetableData,
} from '@/server/actions/timetable';
import type { ViewMode } from './timetable-filters';

interface Props {
  data: TimetableData;
  viewMode: ViewMode;
  selectedTeacherId: string;
  selectedClassId: string;
}

type FlatRow = {
  slot: (typeof TIME_SLOTS)[number];
  cell: TimetableClassCell | null;
};

function flattenRows(
  data: TimetableData,
  viewMode: ViewMode,
  teacherId: string,
  classId: string,
): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const slot of TIME_SLOTS) {
    const all = data.cells[slot] ?? [];
    const filtered = all.filter((c) => {
      if (viewMode === 'BY_TEACHER' && teacherId) return c.teacherId === teacherId;
      if (viewMode === 'BY_CLASS' && classId) return c.classGroupId === classId;
      return true;
    });
    if (filtered.length === 0) {
      rows.push({ slot, cell: null });
    } else {
      for (const c of filtered) rows.push({ slot, cell: c });
    }
  }
  return rows;
}

function cellsPerSlot(
  data: TimetableData,
  viewMode: ViewMode,
  teacherId: string,
  classId: string,
) {
  const map: Partial<Record<(typeof TIME_SLOTS)[number], TimetableClassCell[]>> = {};
  for (const slot of TIME_SLOTS) {
    const all = data.cells[slot] ?? [];
    const filtered = all.filter((c) => {
      if (viewMode === 'BY_TEACHER' && teacherId) return c.teacherId === teacherId;
      if (viewMode === 'BY_CLASS' && classId) return c.classGroupId === classId;
      return true;
    });
    if (filtered.length > 0) map[slot] = filtered;
  }
  return map;
}

function filenameBase(data: TimetableData) {
  const start = new Date(data.weekStart);
  return `emploi-du-temps-${start.toISOString().slice(0, 10)}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export function TimetableExports({
  data,
  viewMode,
  selectedTeacherId,
  selectedClassId,
}: Props) {
  async function exportCsv() {
    const Papa = (await import('papaparse')).default;
    const flat = flattenRows(data, viewMode, selectedTeacherId, selectedClassId);
    const rows = flat.map((r) => ({
      Créneau: TIME_SLOT_LABELS[r.slot],
      Classe: r.cell?.classLabel ?? 'Libre',
      Niveau: r.cell?.levelLabel ?? '',
      Genre:
        r.cell?.classGender === 'GARCON'
          ? 'Garçons'
          : r.cell?.classGender === 'FILLE'
            ? 'Filles'
            : r.cell?.classGender === 'MIXTE'
              ? 'Mixte'
              : '',
      Enseignant: r.cell?.teacherName ?? '',
      Salle: r.cell?.room ?? '',
      Horaires: r.cell ? `${r.cell.startTime} - ${r.cell.endTime}` : '',
      Élèves: r.cell?.studentCount ?? '',
      'Statut appel':
        r.cell?.timing === 'FUTURE'
          ? 'À venir'
          : r.cell?.attendanceStatus === 'DONE'
            ? 'Fait'
            : r.cell?.attendanceStatus === 'PARTIAL'
              ? 'Partiel'
              : r.cell
                ? 'Non fait'
                : '',
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `${filenameBase(data)}.csv`);
  }

  async function exportPdf() {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    const pageW = 297;

    doc.setFillColor(22, 101, 52);
    doc.rect(0, 0, pageW, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ACMSCHOOL — Emploi du temps', 12, 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      `Semaine du ${formatDateFR(data.weekStart)} au ${formatDateFR(data.weekEnd)}`,
      pageW - 12,
      7,
      { align: 'right' },
    );
    doc.setTextColor(0, 0, 0);

    const slotMap = cellsPerSlot(data, viewMode, selectedTeacherId, selectedClassId);

    const startY = 18;
    const colW = 88;
    const rowH = 54;
    const xStart = 12 + 20; // first 20mm is the row label column
    const labelX = 12;

    // Headers
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setFillColor(240, 240, 240);
    doc.rect(labelX, startY, 20, 10, 'F');
    ['Mercredi', 'Samedi', 'Dimanche'].forEach((d, i) => {
      doc.setFillColor(240, 240, 240);
      doc.rect(xStart + i * colW, startY, colW, 10, 'F');
      doc.text(d, xStart + i * colW + colW / 2, startY + 6, { align: 'center' });
    });

    const drawClassBlock = (
      x: number,
      y: number,
      w: number,
      h: number,
      cell: TimetableClassCell,
      compact: boolean,
    ) => {
      const [fillR, fillG, fillB] =
        cell.classGender === 'FILLE'
          ? [253, 242, 248]
          : cell.classGender === 'GARCON'
            ? [239, 246, 255]
            : [250, 245, 255];
      const [borderR, borderG, borderB] =
        cell.classGender === 'FILLE'
          ? [244, 114, 182]
          : cell.classGender === 'GARCON'
            ? [96, 165, 250]
            : [168, 85, 247];
      doc.setFillColor(fillR, fillG, fillB);
      doc.setDrawColor(borderR, borderG, borderB);
      doc.rect(x + 1, y + 1, w - 2, h - 2, 'FD');
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(compact ? 8 : 10);
      doc.text(cell.classLabel, x + 3, y + (compact ? 5 : 7), { maxWidth: w - 6 });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(compact ? 7 : 8);
      if (!compact) {
        doc.text(cell.levelLabel, x + 3, y + 12, { maxWidth: w - 6 });
      }
      doc.text(`Prof : ${cell.teacherName ?? '—'}`, x + 3, y + (compact ? 9 : 18), {
        maxWidth: w - 6,
      });
      if (!compact) {
        doc.text(`${cell.startTime}–${cell.endTime}`, x + 3, y + 23);
      }
      doc.text(`Salle : ${cell.room ?? '—'}`, x + 3, y + (compact ? 13 : 28));
      doc.text(
        `${cell.studentCount} élève(s)`,
        x + 3,
        y + (compact ? (h <= 18 ? 16 : 17) : 33),
      );
    };

    const drawCell = (rowIndex: number, colIndex: number, slot: string | null) => {
      const x = xStart + colIndex * colW;
      const y = startY + 10 + rowIndex * rowH;
      if (!slot) {
        doc.setFillColor(230, 230, 230);
        doc.rect(x, y, colW, rowH, 'F');
        doc.setTextColor(160);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.text('Pas de cours', x + colW / 2, y + rowH / 2, { align: 'center' });
        doc.setTextColor(0);
        return;
      }
      const cells = (slotMap as Record<string, TimetableClassCell[] | undefined>)[slot] ?? [];
      if (cells.length === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(x, y, colW, rowH, 'F');
        doc.setDrawColor(220);
        doc.rect(x, y, colW, rowH);
        doc.setTextColor(150);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.text('Libre', x + colW / 2, y + rowH / 2, { align: 'center' });
        doc.setTextColor(0);
        return;
      }

      const MAX = 3;
      const visible = cells.slice(0, MAX);
      const overflow = cells.length - MAX;
      const slotsCount = visible.length + (overflow > 0 ? 1 : 0);
      const blockH = rowH / Math.max(slotsCount, 1);
      const compact = cells.length > 1;

      visible.forEach((c, i) => {
        drawClassBlock(x, y + i * blockH, colW, blockH, c, compact);
      });

      if (overflow > 0) {
        const oy = y + visible.length * blockH;
        doc.setFillColor(245, 245, 245);
        doc.setDrawColor(150);
        doc.rect(x + 1, oy + 1, colW - 2, blockH - 2, 'FD');
        doc.setTextColor(50);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(
          `+${overflow} autre${overflow > 1 ? 's' : ''} classe${overflow > 1 ? 's' : ''}`,
          x + colW / 2,
          oy + blockH / 2 + 1,
          { align: 'center' },
        );
        doc.setTextColor(0);
      }
    };

    // Row labels
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setFillColor(240, 240, 240);
    doc.rect(labelX, startY + 10, 20, rowH, 'F');
    doc.text('Matin', labelX + 10, startY + 10 + rowH / 2 - 2, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('09:00–12:00', labelX + 10, startY + 10 + rowH / 2 + 3, {
      align: 'center',
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setFillColor(240, 240, 240);
    doc.rect(labelX, startY + 10 + rowH, 20, rowH, 'F');
    doc.text('Après-midi', labelX + 10, startY + 10 + rowH + rowH / 2 - 2, {
      align: 'center',
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('14:00–17:00', labelX + 10, startY + 10 + rowH + rowH / 2 + 3, {
      align: 'center',
    });

    // Cells
    drawCell(0, 0, null); // Mercredi matin — disabled
    drawCell(0, 1, 'SAMEDI_AM');
    drawCell(0, 2, 'DIMANCHE_AM');
    drawCell(1, 0, 'MERCREDI_PM');
    drawCell(1, 1, 'SAMEDI_PM');
    drawCell(1, 2, 'DIMANCHE_PM');

    // Recap table below
    const flat = flattenRows(data, viewMode, selectedTeacherId, selectedClassId);
    const bodyRows = flat
      .filter((r) => r.cell)
      .map((r) => [
        TIME_SLOT_LABELS[r.slot],
        r.cell!.classLabel,
        r.cell!.teacherName ?? '—',
        r.cell!.room ?? '—',
        `${r.cell!.startTime}–${r.cell!.endTime}`,
        String(r.cell!.studentCount),
        r.cell!.timing === 'FUTURE'
          ? 'À venir'
          : r.cell!.attendanceStatus === 'DONE'
            ? 'Appel fait'
            : r.cell!.attendanceStatus === 'PARTIAL'
              ? 'Partiel'
              : 'Non fait',
      ]);

    autoTable(doc, {
      startY: startY + 10 + rowH * 2 + 6,
      head: [
        ['Créneau', 'Classe', 'Enseignant', 'Salle', 'Horaires', 'Élèves', 'Appel'],
      ],
      body: bodyRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 101, 52] },
      margin: { left: 12, right: 12 },
    });

    doc.save(`${filenameBase(data)}.pdf`);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="no-print flex flex-wrap gap-1.5">
      <Button variant="outline" size="sm" onClick={exportCsv} title="Exporter CSV">
        <FileText className="h-3.5 w-3.5" />
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportPdf} title="Exporter PDF paysage">
        <FileDown className="h-3.5 w-3.5" />
        PDF
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint} title="Imprimer">
        <Printer className="h-3.5 w-3.5" />
        Imprimer
      </Button>
    </div>
  );
}
