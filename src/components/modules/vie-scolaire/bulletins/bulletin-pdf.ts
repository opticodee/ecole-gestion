'use client';

import { MENTION_LABELS } from '@/lib/bulletin';
import { formatAverage } from '@/lib/bulletin';
import { formatDateFR } from '@/lib/formatters';
import type {
  BulletinClassContext,
  BulletinStudent,
} from '@/server/actions/bulletins';

export async function generateBulletinPDF(
  context: BulletinClassContext,
  students: BulletinStudent[],
  filename: string,
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', format: 'a4', unit: 'mm' });

  students.forEach((student, index) => {
    if (index > 0) doc.addPage();
    renderBulletinPage(doc, autoTable, context, student);
  });

  doc.save(filename);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AutoTableFn = (doc: any, options: Record<string, unknown>) => void;

function renderBulletinPage(
  doc: InstanceType<typeof import('jspdf').default>,
  autoTable: AutoTableFn,
  ctx: BulletinClassContext,
  student: BulletinStudent,
) {
  const pageW = 210;
  const marginX = 15;
  let y = 15;

  // Header band
  doc.setFillColor(22, 101, 52);
  doc.rect(0, 0, pageW, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(ctx.schoolName, marginX, 7);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Année scolaire ${ctx.academicYearLabel} — Trimestre ${ctx.period}`,
    pageW - marginX,
    7,
    { align: 'right' },
  );

  y = 18;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('BULLETIN SCOLAIRE', pageW / 2, y, { align: 'center' });
  y += 8;

  // Student info block
  doc.setDrawColor(200);
  doc.setLineWidth(0.2);
  doc.rect(marginX, y, pageW - 2 * marginX, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Élève : ${student.lastName.toUpperCase()} ${student.firstName}`, marginX + 3, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Matricule : ${student.matricule}`, marginX + 3, y + 11);
  doc.text(`Classe : ${ctx.classLabel}`, marginX + 3, y + 16);
  doc.text(`Niveau : ${ctx.levelLabel}`, pageW / 2, y + 11);
  doc.text(`Professeur : ${ctx.mainTeacherName ?? '—'}`, pageW / 2, y + 16);
  y += 25;

  // Notes table
  const body: string[][] = [];
  for (const subj of student.subjects) {
    const evalLabels = subj.evaluations
      .map((e) => {
        const prefix = e.type === 'EXAMEN' ? 'Ex.' : 'Ct.';
        const scoreStr = e.isAbsent
          ? 'abs.'
          : e.score !== null && e.score !== undefined
            ? `${e.score.toFixed(1)}/${e.scale}`
            : '—';
        return `${prefix} ${formatDateFR(e.date)} : ${scoreStr}`;
      })
      .join('\n');
    const coefs = subj.evaluations.map((e) => e.coefficient).join(' / ');
    body.push([subj.subjectLabel, evalLabels, coefs, formatAverage(subj.average)]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Matière', 'Évaluations', 'Coef.', 'Moyenne']],
    body,
    styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
    headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold' },
      1: { cellWidth: 90 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: marginX, right: marginX },
  });

  // @ts-expect-error lastAutoTable set by plugin
  y = (doc.lastAutoTable?.finalY ?? y + 30) + 4;

  // Averages/rank/mention summary
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Moyenne générale : ${formatAverage(student.overallAverage)}/20`.replace('/20', '/10'), marginX, y);
  doc.text(
    `Rang : ${student.overallAverage === null ? '—' : `${student.rank} / ${student.totalStudents}`}`,
    pageW / 2,
    y,
  );
  doc.text(`Moyenne classe : ${formatAverage(student.classAverage)}`, pageW - marginX, y, {
    align: 'right',
  });
  y += 8;

  // Mention badge
  if (student.effectiveMention) {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(180, 140, 40);
    const mentionLabel = `Mention : ${MENTION_LABELS[student.effectiveMention]}`;
    const w = doc.getTextWidth(mentionLabel) + 10;
    doc.roundedRect((pageW - w) / 2, y, w, 9, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(133, 77, 14);
    doc.text(mentionLabel, pageW / 2, y + 6, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 13;
  }

  // Appreciation générale
  if (student.generalComment) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Appréciation générale :', marginX, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    const generalLines = doc.splitTextToSize(student.generalComment, pageW - 2 * marginX);
    doc.text(generalLines, marginX, y);
    y += generalLines.length * 4 + 3;
  }

  // Commentaire du conseil
  if (student.councilComment) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Commentaire du conseil :', marginX, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    const cLines = doc.splitTextToSize(student.councilComment, pageW - 2 * marginX);
    doc.text(cLines, marginX, y);
    y += cLines.length * 4 + 3;
  }

  // Appréciations par matière
  const subjectWithComment = student.subjects.filter((s) => student.subjectComments[s.subjectId]);
  if (subjectWithComment.length > 0 && y < 250) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Appréciations par matière :', marginX, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    for (const subj of subjectWithComment) {
      const comment = student.subjectComments[subj.subjectId] ?? '';
      const lines = doc.splitTextToSize(`${subj.subjectLabel} : ${comment}`, pageW - 2 * marginX);
      doc.text(lines, marginX, y);
      y += lines.length * 4 + 1;
      if (y > 270) break;
    }
  }

  // Footer
  const footerY = 282;
  doc.setDrawColor(200);
  doc.line(marginX, footerY - 14, pageW - marginX, footerY - 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Généré le ${formatDateFR(new Date())}`, marginX, footerY - 9);
  doc.text('Signature : _____________________', pageW - marginX, footerY - 9, { align: 'right' });
  doc.setTextColor(130);
  doc.text(`${ctx.schoolName} — Bulletin trimestriel`, pageW / 2, footerY, { align: 'center' });
  doc.setTextColor(0, 0, 0);
}
