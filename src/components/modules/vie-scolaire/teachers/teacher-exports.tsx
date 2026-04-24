'use client';

import { FileText, FileSpreadsheet, FileDown, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateFR, GENDER_LABELS_STUDENT } from '@/lib/formatters';
import type { TeacherRow } from '@/server/actions/teachers';

function buildRows(teachers: TeacherRow[]) {
  return teachers.map((t) => ({
    Genre: t.gender ? GENDER_LABELS_STUDENT[t.gender] ?? t.gender : '',
    Nom: t.lastName,
    Prénom: t.firstName,
    Email: t.email,
    Téléphone: t.phone ?? '',
    'Classes assignées': t.classes.map((c) => c.label).join(' ; '),
    'Nb classes': t.classCount,
    Statut: t.isActive ? 'Actif' : 'Inactif',
  }));
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

export function TeacherExports({ teachers }: { teachers: TeacherRow[] }) {
  async function exportCsv() {
    const Papa = (await import('papaparse')).default;
    const csv = Papa.unparse(buildRows(teachers));
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `enseignants-${today()}.csv`);
  }

  async function exportExcel() {
    const XLSX = await import('xlsx');
    const rows = buildRows(teachers);
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Object.keys(rows[0] ?? { Genre: '' }).map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Enseignants');
    XLSX.writeFile(wb, `enseignants-${today()}.xlsx`);
  }

  async function exportPdf() {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape' });
    const rows = buildRows(teachers);
    const headers = Object.keys(rows[0] ?? { Nom: '' });
    doc.setFontSize(14);
    doc.text('Liste des enseignants — ACMSCHOOL', 14, 15);
    doc.setFontSize(9);
    doc.text(`Généré le ${formatDateFR(new Date())}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [headers],
      body: rows.map((r) => headers.map((h) => String(r[h as keyof typeof r] ?? ''))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 101, 52] },
    });
    doc.save(`enseignants-${today()}.pdf`);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="no-print flex flex-wrap gap-1.5">
      <Button variant="outline" size="sm" onClick={exportCsv} title="Export CSV">
        <FileText className="h-3.5 w-3.5" />
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportExcel} title="Export Excel">
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Excel
      </Button>
      <Button variant="outline" size="sm" onClick={exportPdf} title="Export PDF">
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
