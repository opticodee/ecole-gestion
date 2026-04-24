'use client';

import { FileText, FileSpreadsheet, FileDown, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAverage } from '@/lib/bulletin';
import { formatDateFR } from '@/lib/formatters';
import type { GradesSummary } from '@/server/actions/grades-summary';

function buildRows(summary: GradesSummary) {
  return summary.rows.map((r) => {
    const row: Record<string, string | number> = {
      Rang: r.overallAverage === null ? '' : r.rank,
      Nom: r.lastName,
      Prénom: r.firstName,
      Matricule: r.matricule,
    };
    for (const subj of summary.subjects) {
      for (const col of subj.evaluations) {
        const g = r.grades[col.evaluationId];
        const header = `${subj.subjectLabel} — ${col.shortLabel}`;
        row[header] = g?.isAbsent ? 'Abs.' : g?.score !== null && g?.score !== undefined ? g.score : '';
      }
      row[`${subj.subjectLabel} — Moy.`] = formatAverage(r.subjectAverages[subj.subjectId]);
    }
    row['Moy. Générale'] = formatAverage(r.overallAverage);
    return row;
  });
}

export function GradesSummaryExports({ summary }: { summary: GradesSummary }) {
  const filenameBase = `notes-${summary.classLabel}-${summary.periodKey}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  async function exportCsv() {
    const Papa = (await import('papaparse')).default;
    const csv = Papa.unparse(buildRows(summary));
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `${filenameBase}.csv`);
  }

  async function exportExcel() {
    const XLSX = await import('xlsx');
    const rows = buildRows(summary);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Notes');
    XLSX.writeFile(wb, `${filenameBase}.xlsx`);
  }

  async function exportPdf() {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    doc.setFontSize(14);
    doc.text(`Notes & Moyennes — ${summary.classLabel}`, 14, 15);
    doc.setFontSize(9);
    doc.text(
      `${summary.periodLabel} — ${summary.academicYearLabel} — Généré le ${formatDateFR(new Date())}`,
      14,
      22,
    );
    const rows = buildRows(summary);
    const headers = Object.keys(rows[0] ?? { Nom: '' });
    autoTable(doc, {
      startY: 28,
      head: [headers],
      body: rows.map((r) => headers.map((h) => String(r[h] ?? ''))),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [22, 101, 52] },
    });
    doc.save(`${filenameBase}.pdf`);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="no-print flex flex-wrap gap-1.5">
      <Button variant="outline" size="sm" onClick={exportCsv}>
        <FileText className="h-3.5 w-3.5" />
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportExcel}>
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Excel
      </Button>
      <Button variant="outline" size="sm" onClick={exportPdf}>
        <FileDown className="h-3.5 w-3.5" />
        PDF
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="h-3.5 w-3.5" />
        Imprimer
      </Button>
    </div>
  );
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
