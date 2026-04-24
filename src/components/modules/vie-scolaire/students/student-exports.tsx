'use client';

import { FileText, FileSpreadsheet, FileDown, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StudentRow } from '@/server/actions/students';
import {
  computeAge,
  formatDateFR,
  GENDER_LABELS_STUDENT,
  STUDENT_STATUS_LABELS,
} from '@/lib/formatters';

function buildRows(students: StudentRow[]) {
  return students.map((s) => ({
    Genre: GENDER_LABELS_STUDENT[s.gender] || s.gender,
    Nom: s.lastName,
    Prénom: s.firstName,
    'Date de naissance': formatDateFR(s.dateOfBirth),
    Âge: computeAge(s.dateOfBirth),
    Classe: s.classLabel,
    Niveau: s.levelLabel,
    Statut: STUDENT_STATUS_LABELS[s.status] || s.status,
  }));
}

export function StudentExports({ students }: { students: StudentRow[] }) {
  async function exportCsv() {
    const Papa = (await import('papaparse')).default;
    const csv = Papa.unparse(buildRows(students));
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `eleves-${today()}.csv`);
  }

  async function exportExcel() {
    const XLSX = await import('xlsx');
    const rows = buildRows(students);
    const ws = XLSX.utils.json_to_sheet(rows);
    const headerRange = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
    for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      const cell = ws[addr];
      if (cell) cell.s = { font: { bold: true } };
    }
    ws['!cols'] = Object.keys(rows[0] ?? { Genre: '' }).map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Élèves');
    XLSX.writeFile(wb, `eleves-${today()}.xlsx`);
  }

  async function exportPdf() {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape' });
    const rows = buildRows(students);
    const headers = Object.keys(rows[0] ?? { Nom: '' });
    doc.setFontSize(14);
    doc.text('Liste des élèves - ACMSCHOOL', 14, 15);
    doc.setFontSize(9);
    doc.text(`Généré le ${formatDateFR(new Date())}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [headers],
      body: rows.map((r) =>
        headers.map((h) => String(r[h as keyof typeof r] ?? '')),
      ),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 101, 52] },
    });
    doc.save(`eleves-${today()}.pdf`);
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

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
