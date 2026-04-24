'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import {
  computeAutoMention,
  computeRanks,
  getPeriodRange,
  periodKeyFromNumber,
  simpleAverage,
  weightedAverage,
  type MentionKey,
} from '@/lib/bulletin';

export interface BulletinEvaluation {
  evaluationId: string;
  label: string;
  date: string;
  type: 'CONTROLE' | 'EXAMEN';
  coefficient: number;
  scale: number;
  score: number | null;
  isAbsent: boolean;
}

export interface BulletinSubjectBlock {
  subjectId: string;
  subjectLabel: string;
  evaluations: BulletinEvaluation[];
  average: number | null;
}

export interface BulletinStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  matricule: string;
  subjects: BulletinSubjectBlock[];
  overallAverage: number | null;
  rank: number;
  totalStudents: number;
  classAverage: number | null;
  autoMention: MentionKey | null;
  manualMention: MentionKey | null;
  effectiveMention: MentionKey | null;
  generalComment: string;
  subjectComments: Record<string, string>;
  councilComment: string;
}

export interface BulletinClassContext {
  schoolName: string;
  schoolId: string;
  classLabel: string;
  levelLabel: string;
  mainTeacherName: string | null;
  academicYearLabel: string;
  period: number;
  generatedAt: string;
}

export interface BulletinsSummary {
  context: BulletinClassContext;
  readiness: {
    totalStudents: number;
    totalEvaluations: number;
    lockedEvaluations: number;
    studentsWithAppreciation: number;
    studentsWithMention: number;
  };
  bulletins: BulletinStudent[];
}

export async function getBulletinsData(
  classGroupId: string,
  period: number,
): Promise<{ error?: string; data?: BulletinsSummary }> {
  const session = await requireAuth();
  const schoolId = session.user.schoolId;

  const [school, classGroup, year] = await Promise.all([
    prisma.school.findFirst({ where: { id: schoolId }, select: { name: true } }),
    prisma.classGroup.findFirst({
      where: { id: classGroupId, schoolId },
      include: {
        level: { select: { label: true } },
        mainTeacher: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
        students: {
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
          select: { id: true, firstName: true, lastName: true, matricule: true },
        },
      },
    }),
    prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
      select: { id: true, label: true, startDate: true, endDate: true },
    }),
  ]);

  if (!classGroup) return { error: 'Classe introuvable.' };
  if (!year) return { error: 'Aucune année scolaire en cours.' };

  const periodKey = periodKeyFromNumber(period);
  const { start, end } = getPeriodRange(periodKey, year.startDate, year.endDate);

  const evaluations = await prisma.evaluation.findMany({
    where: {
      schoolId,
      classGroupId,
      date: { gte: start, lte: end },
    },
    include: {
      subject: { select: { id: true, label: true, parentId: true } },
      grades: { select: { studentId: true, score: true, isAbsent: true } },
    },
    orderBy: { date: 'asc' },
  });

  const topLevels = await prisma.subject.findMany({
    where: { schoolId, parentId: null },
    select: { id: true, label: true },
    orderBy: { label: 'asc' },
  });
  const allSubjectIds = Array.from(new Set(evaluations.map((e) => e.subjectId)));
  const allSubjects = await prisma.subject.findMany({
    where: { schoolId, id: { in: allSubjectIds } },
    select: { id: true, parentId: true, label: true },
  });
  const subjectMap = new Map(allSubjects.map((s) => [s.id, s]));
  const topMap = new Map(topLevels.map((s) => [s.id, s]));

  function mainSubjectIdFor(subjectId: string): string {
    let current = subjectMap.get(subjectId);
    let guard = 0;
    while (current?.parentId && guard < 10) {
      const parent = subjectMap.get(current.parentId) ?? topMap.get(current.parentId);
      if (!parent) break;
      current = parent as typeof current;
      guard++;
    }
    return current?.id ?? subjectId;
  }

  const appreciations = await prisma.appreciation.findMany({
    where: {
      classGroupId,
      period,
      academicYearId: year.id,
    },
  });
  const byStudent = new Map(appreciations.map((a) => [a.studentId, a]));

  // First pass: compute overall averages to enable ranking.
  const overallByStudent = new Map<string, number | null>();
  const perStudentSubjectBlocks = new Map<string, BulletinSubjectBlock[]>();

  for (const s of classGroup.students) {
    const blocks: BulletinSubjectBlock[] = [];
    for (const top of topLevels) {
      const relevant = evaluations.filter((e) => mainSubjectIdFor(e.subjectId) === top.id);
      if (relevant.length === 0) continue;
      const evalLines: BulletinEvaluation[] = relevant.map((e) => {
        const g = e.grades.find((x) => x.studentId === s.id);
        return {
          evaluationId: e.id,
          label: e.label,
          date: e.date.toISOString(),
          type: e.evaluationType,
          coefficient: e.coefficient,
          scale: e.scale,
          score: g ? g.score : null,
          isAbsent: g ? g.isAbsent : false,
        };
      });
      const avg = weightedAverage(
        evalLines.map((l) => ({ score: l.score, isAbsent: l.isAbsent, coefficient: l.coefficient })),
      );
      blocks.push({
        subjectId: top.id,
        subjectLabel: top.label,
        evaluations: evalLines,
        average: avg,
      });
    }
    const overall = simpleAverage(blocks.map((b) => b.average));
    overallByStudent.set(s.id, overall);
    perStudentSubjectBlocks.set(s.id, blocks);
  }

  const ranks = computeRanks(
    classGroup.students.map((s) => ({ id: s.id, average: overallByStudent.get(s.id) ?? null })),
  );
  const overallList = Array.from(overallByStudent.values()).filter(
    (v): v is number => v !== null,
  );
  const classAverage = overallList.length
    ? overallList.reduce((a, b) => a + b, 0) / overallList.length
    : null;

  const bulletins: BulletinStudent[] = classGroup.students.map((s) => {
    const overall = overallByStudent.get(s.id) ?? null;
    const autoMention = computeAutoMention(overall);
    const app = byStudent.get(s.id);
    const manualMention = (app?.manualMention as MentionKey | null) ?? null;
    const effectiveMention = manualMention ?? autoMention;
    const subjectCommentsRaw = (app?.subjectComments as Record<string, string> | null) ?? {};
    return {
      studentId: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      matricule: s.matricule,
      subjects: perStudentSubjectBlocks.get(s.id) ?? [],
      overallAverage: overall,
      rank: ranks.get(s.id) ?? 0,
      totalStudents: classGroup.students.length,
      classAverage,
      autoMention,
      manualMention,
      effectiveMention,
      generalComment: app?.generalComment ?? '',
      subjectComments: subjectCommentsRaw,
      councilComment: app?.councilComment ?? '',
    };
  });

  const mainTeacherName = classGroup.mainTeacher
    ? `${classGroup.mainTeacher.user.firstName} ${classGroup.mainTeacher.user.lastName}`
    : null;

  const studentsWithAppreciation = bulletins.filter(
    (b) => b.generalComment && b.generalComment.trim() !== '',
  ).length;
  const studentsWithMention = bulletins.filter((b) => b.effectiveMention !== null).length;
  const lockedEvaluations = evaluations.filter((e) => e.isLocked).length;

  return {
    data: {
      context: {
        schoolName: school?.name ?? 'ACMSCHOOL',
        schoolId,
        classLabel: classGroup.label,
        levelLabel: classGroup.level.label,
        mainTeacherName,
        academicYearLabel: year.label,
        period,
        generatedAt: new Date().toISOString(),
      },
      readiness: {
        totalStudents: classGroup.students.length,
        totalEvaluations: evaluations.length,
        lockedEvaluations,
        studentsWithAppreciation,
        studentsWithMention,
      },
      bulletins,
    },
  };
}
