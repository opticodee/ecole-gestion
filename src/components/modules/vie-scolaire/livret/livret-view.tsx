'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { BookOpen, FileDown, Loader2, Printer, User } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SearchInput } from '@/components/shared/search-input';
import { cn } from '@/lib/utils';
import {
  MENTION_COLORS,
  MENTION_LABELS,
  formatAverage,
} from '@/lib/bulletin';
import {
  COUNCIL_DECISION_COLORS,
  COUNCIL_DECISION_LABELS,
  type CouncilDecision,
} from '@/lib/validators/council';
import { computeAge, formatDateFR, GENDER_LABELS_STUDENT } from '@/lib/formatters';
import {
  getLivretData,
  type LivretData,
  type LivretStudent,
} from '@/server/actions/livret';
import { generateLivretPDF } from './livret-pdf';

interface Props {
  students: LivretStudent[];
}

export function LivretView({ students }: Props) {
  const [search, setSearch] = useState('');
  const [studentId, setStudentId] = useState<string>('');
  const [data, setData] = useState<LivretData | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      `${s.firstName} ${s.lastName} ${s.matricule}`.toLowerCase().includes(q),
    );
  }, [students, search]);

  function handleLoad(id: string) {
    setStudentId(id);
    startTransition(async () => {
      const result = await getLivretData(id);
      if (result.error) {
        toast.error(result.error);
        setData(null);
        return;
      }
      setData(result.data ?? null);
    });
  }

  async function handleDownload() {
    if (!data) return;
    const filename = `livret-${data.student.lastName}-${data.student.firstName}.pdf`
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-');
    await generateLivretPDF(data, filename);
    toast.success('Livret PDF généré.');
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Livret scolaire</h1>
        </div>
        {data && (
          <div className="no-print flex flex-wrap gap-1.5">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <FileDown className="h-3.5 w-3.5" />
              Télécharger PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" />
              Imprimer
            </Button>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/admin/vie-scolaire/eleves/${data.student.id}`} />}
            >
              <User className="h-3.5 w-3.5" />
              Fiche élève
            </Button>
          </div>
        )}
      </div>

      <div className="no-print flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Rechercher un élève
          </label>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Nom, prénom ou matricule..."
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Élève</label>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            value={studentId}
            onChange={(e) => e.target.value && handleLoad(e.target.value)}
          >
            <option value="">— Sélectionner un élève —</option>
            {filteredStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.lastName.toUpperCase()} {s.firstName} · {s.classLabel} · {s.matricule}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {data && !isPending && <LivretDocument data={data} />}

      {!data && !isPending && (
        <div className="rounded-lg border border-dashed bg-muted/20 py-16 text-center text-sm text-muted-foreground">
          Sélectionnez un élève pour afficher son livret scolaire.
        </div>
      )}
    </div>
  );
}

function LivretDocument({ data }: { data: LivretData }) {
  const initials = `${data.student.firstName[0] ?? ''}${data.student.lastName[0] ?? ''}`.toUpperCase();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-lg font-bold">
                {data.student.lastName.toUpperCase()} {data.student.firstName}
              </div>
              <div className="text-xs text-muted-foreground">
                Matricule : {data.student.matricule} ·{' '}
                {GENDER_LABELS_STUDENT[data.student.gender] ?? data.student.gender} ·
                Né(e) le {formatDateFR(data.student.dateOfBirth)} (
                {computeAge(data.student.dateOfBirth)} ans)
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge variant="secondary">{data.student.currentClassLabel}</Badge>
                <Badge variant="outline">{data.student.currentLevelLabel}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.years.length === 0 ? (
        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          Aucune donnée scolaire enregistrée pour cet élève.
        </div>
      ) : (
        data.years.map((year) => (
          <Card key={year.academicYearLabel}>
            <CardHeader>
              <CardTitle className="text-base">
                Année scolaire {year.academicYearLabel} — Classe : {year.classLabel}
                {year.teacherName && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}
                    — Enseignant : {year.teacherName}
                  </span>
                )}
              </CardTitle>
              {year.yearAverage !== null && (
                <div className="text-xs text-muted-foreground">
                  Moyenne annuelle : <strong>{formatAverage(year.yearAverage)}</strong>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {year.trimesters.map((t) => (
                <div key={t.period} className="space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold">Trimestre {t.period}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Moy : <strong className="text-foreground">{formatAverage(t.overallAverage)}</strong>
                      </span>
                      <span>
                        Rang :{' '}
                        <strong className="text-foreground">
                          {t.rank === null ? '—' : `${t.rank} / ${t.totalStudents}`}
                        </strong>
                      </span>
                      <span>
                        Absences : <strong className="text-foreground">{t.absenceCount}</strong>
                      </span>
                      {t.mention && (
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                            MENTION_COLORS[t.mention],
                          )}
                        >
                          {MENTION_LABELS[t.mention]}
                        </span>
                      )}
                      {t.councilDecision && t.councilDecision !== 'NONE' && (
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                            COUNCIL_DECISION_COLORS[t.councilDecision as CouncilDecision],
                          )}
                        >
                          {COUNCIL_DECISION_LABELS[t.councilDecision as CouncilDecision]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-primary/5">
                          <TableHead>Matière</TableHead>
                          <TableHead className="w-20 text-center">Moyenne</TableHead>
                          <TableHead>Appréciation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {t.subjectAverages.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="py-4 text-center text-xs text-muted-foreground">
                              Aucune évaluation sur ce trimestre.
                            </TableCell>
                          </TableRow>
                        ) : (
                          t.subjectAverages.map((s) => (
                            <TableRow key={s.subjectId}>
                              <TableCell className="font-medium">{s.subjectLabel}</TableCell>
                              <TableCell className="text-center font-semibold">
                                {formatAverage(s.average)}
                              </TableCell>
                              <TableCell className="text-xs">
                                {s.comment || <span className="text-muted-foreground">—</span>}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {t.generalComment && (
                    <div className="rounded-md border bg-muted/20 p-2 text-xs">
                      <span className="font-semibold">Appréciation générale : </span>
                      {t.generalComment}
                    </div>
                  )}
                  {t.councilObservation && (
                    <div className="rounded-md border bg-muted/20 p-2 text-xs italic">
                      <span className="font-semibold">Observation conseil : </span>
                      {t.councilObservation}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
