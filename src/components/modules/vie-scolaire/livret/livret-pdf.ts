'use client';

import {
  MENTION_LABELS,
  formatAverage,
} from '@/lib/bulletin';
import {
  COUNCIL_DECISION_LABELS,
  type CouncilDecision,
} from '@/lib/validators/council';
import { computeAge, formatDateFR, GENDER_LABELS_STUDENT } from '@/lib/formatters';
import type { LivretData } from '@/server/actions/livret';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AutoTableFn = (doc: any, options: Record<string, unknown>) => void;

export async function generateLivretPDF(data: LivretData, filename: string) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', format: 'a4', unit: 'mm' });
  const pageW = 210;
  const marginX = 15;

  // --- Cover ---
  doc.setFillColor(22, 101, 52);
  doc.rect(0, 0, pageW, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('ACMSCHOOL', marginX, 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Livret scolaire', pageW - marginX, 8, { align: 'right' });

  let y = 22;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('LIVRET SCOLAIRE', pageW / 2, y, { align: 'center' });
  y += 8;

  doc.setDrawColor(200);
  doc.rect(marginX, y, pageW - 2 * marginX, 26);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${data.student.lastName.toUpperCase()} ${data.student.firstName}`, marginX + 3, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Matricule : ${data.student.matricule}`, marginX + 3, y + 13);
  doc.text(
    `Genre : ${GENDER_LABELS_STUDENT[data.student.gender] ?? data.student.gender}`,
    marginX + 3,
    y + 18,
  );
  doc.text(
    `Né(e) le : ${formatDateFR(data.student.dateOfBirth)} (${computeAge(data.student.dateOfBirth)} ans)`,
    marginX + 3,
    y + 23,
  );
  doc.text(`Classe actuelle : ${data.student.currentClassLabel}`, pageW / 2, y + 13);
  doc.text(`Niveau : ${data.student.currentLevelLabel}`, pageW / 2, y + 18);
  y += 32;

  if (data.years.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Aucune donnée scolaire enregistrée.', pageW / 2, y + 10, { align: 'center' });
    doc.save(filename);
    return;
  }

  // --- Years ---
  for (const year of data.years) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(230, 242, 230);
    doc.rect(marginX, y, pageW - 2 * marginX, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(22, 101, 52);
    doc.text(
      `Année ${year.academicYearLabel} — ${year.classLabel}`,
      marginX + 3,
      y + 6,
    );
    if (year.teacherName) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Enseignant : ${year.teacherName}`, pageW - marginX - 3, y + 6, {
        align: 'right',
      });
    }
    doc.setTextColor(0, 0, 0);
    y += 12;

    if (year.yearAverage !== null) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Moyenne annuelle : ${formatAverage(year.yearAverage)}`, marginX, y);
      y += 5;
    }

    for (const t of year.trimesters) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Trimestre ${t.period}`, marginX, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const summary = [
        `Moyenne : ${formatAverage(t.overallAverage)}`,
        `Rang : ${t.rank === null ? '—' : `${t.rank}/${t.totalStudents}`}`,
        `Absences : ${t.absenceCount}`,
        t.mention ? `Mention : ${MENTION_LABELS[t.mention]}` : null,
        t.councilDecision && t.councilDecision !== 'NONE'
          ? `Conseil : ${COUNCIL_DECISION_LABELS[t.councilDecision as CouncilDecision]}`
          : null,
      ]
        .filter(Boolean)
        .join(' · ');
      doc.text(summary, marginX, y);
      y += 4;

      (autoTable as AutoTableFn)(doc, {
        startY: y,
        head: [['Matière', 'Moyenne', 'Appréciation']],
        body: t.subjectAverages.map((s) => [
          s.subjectLabel,
          formatAverage(s.average),
          s.comment || '—',
        ]),
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 100 },
        },
        margin: { left: marginX, right: marginX },
      });
      // @ts-expect-error plugin metadata
      y = (doc.lastAutoTable?.finalY ?? y + 20) + 3;

      if (t.generalComment) {
        const lines = doc.splitTextToSize(
          `Appréciation générale : ${t.generalComment}`,
          pageW - 2 * marginX,
        );
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text(lines, marginX, y);
        y += lines.length * 3.5 + 2;
      }
      if (t.councilObservation) {
        const lines = doc.splitTextToSize(
          `Observation conseil : ${t.councilObservation}`,
          pageW - 2 * marginX,
        );
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text(lines, marginX, y);
        y += lines.length * 3.5 + 2;
      }
      y += 3;
    }
  }

  // Footer on each page
  const pageCount = (doc.internal as unknown as { pages: unknown[] }).pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(130);
    doc.text(
      `Généré le ${formatDateFR(new Date())} — ACMSCHOOL — Page ${i}/${pageCount}`,
      pageW / 2,
      290,
      { align: 'center' },
    );
    doc.setTextColor(0);
  }

  doc.save(filename);
}
