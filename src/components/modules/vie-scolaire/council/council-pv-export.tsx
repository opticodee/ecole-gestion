'use client';

import { FileDown, FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  COUNCIL_DECISION_LABELS,
  type CouncilDecision,
} from '@/lib/validators/council';
import { MENTION_LABELS, formatAverage } from '@/lib/bulletin';
import { formatDateFR } from '@/lib/formatters';
import type { CouncilRow, CouncilSummary } from '@/server/actions/council';

interface Props {
  data: CouncilSummary;
  rows: CouncilRow[];
}

function buildRows(rows: CouncilRow[]) {
  return rows.map((r) => ({
    Rang: r.overallAverage === null ? '' : r.rank,
    Nom: r.lastName,
    Prénom: r.firstName,
    Moyenne: formatAverage(r.overallAverage),
    Absences: r.absenceCount,
    Mention: r.effectiveMention ? MENTION_LABELS[r.effectiveMention] : '',
    Décision: r.councilDecision ? COUNCIL_DECISION_LABELS[r.councilDecision as CouncilDecision] : '',
    Observation: r.councilObservation || '',
  }));
}

function filenameBase(data: CouncilSummary) {
  return `pv-conseil-${data.classLabel}-T${data.period}`
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-');
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

export function CouncilPvExport({ data, rows }: Props) {
  async function exportCsv() {
    const Papa = (await import('papaparse')).default;
    const csv = Papa.unparse(buildRows(rows));
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `${filenameBase(data)}.csv`);
  }

  async function exportPdf() {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });
    const pageW = 210;

    // Header
    doc.setFillColor(22, 101, 52);
    doc.rect(0, 0, pageW, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ACMSCHOOL', 15, 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      `Année ${data.academicYearLabel} — Trimestre ${data.period}`,
      pageW - 15,
      7,
      { align: 'right' },
    );

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PROCÈS-VERBAL DU CONSEIL DE CLASSE', pageW / 2, 22, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Classe : ${data.classLabel}`, 15, 32);
    doc.text(`Niveau : ${data.levelLabel}`, 15, 38);
    doc.text(`Date du conseil : ${formatDateFR(new Date())}`, pageW - 15, 32, { align: 'right' });
    doc.text(
      `Moyenne classe : ${formatAverage(data.classAverage)} · Élèves : ${data.totalStudents}`,
      pageW - 15,
      38,
      { align: 'right' },
    );

    // Table
    const tableRows = buildRows(rows);
    const headers = Object.keys(tableRows[0] ?? { Nom: '' });
    autoTable(doc, {
      startY: 46,
      head: [headers],
      body: tableRows.map((r) => headers.map((h) => String(r[h as keyof typeof r] ?? ''))),
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 22 },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 14, halign: 'center' },
        5: { cellWidth: 22 },
        6: { cellWidth: 30 },
        7: { cellWidth: 42 },
      },
      margin: { left: 15, right: 15 },
    });

    // Signatures
    const pageCount = (doc.internal as unknown as { pages: unknown[] }).pages.length - 1;
    doc.setPage(pageCount);
    const footerY = 278;
    doc.setDrawColor(200);
    doc.line(15, footerY - 18, pageW - 15, footerY - 18);
    doc.setFontSize(9);
    doc.text('Signature du directeur', 40, footerY - 6, { align: 'center' });
    doc.text('____________________', 40, footerY, { align: 'center' });
    doc.text("Signature de l'enseignant", pageW - 40, footerY - 6, { align: 'center' });
    doc.text('____________________', pageW - 40, footerY, { align: 'center' });

    doc.save(`${filenameBase(data)}.pdf`);
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
      <Button variant="outline" size="sm" onClick={exportPdf}>
        <FileDown className="h-3.5 w-3.5" />
        PV PDF
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="h-3.5 w-3.5" />
        Imprimer
      </Button>
    </div>
  );
}
