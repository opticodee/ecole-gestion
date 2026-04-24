'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, CalendarDays, AlertTriangle, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { StudentForm } from './student-form';
import type { StudentDetail as StudentDetailData } from '@/server/actions/students';
import {
  computeAge,
  formatDateFR,
  GENDER_LABELS_STUDENT,
  RELATIONSHIP_LABELS,
  STUDENT_STATUS_LABELS,
} from '@/lib/formatters';
import { TIME_SLOT_LABELS } from '@/lib/time-slots';
import { cn } from '@/lib/utils';
import { ABSENCE_ALERT_THRESHOLD } from '@/lib/constants';

interface ClassOption {
  id: string;
  label: string;
  classGender: string;
  capacity: number;
  studentCount: number;
  levelLabel: string;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value || <span className="text-muted-foreground">—</span>}</p>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const variants: Record<string, string> = {
    INSCRIT: 'bg-green-100 text-green-700 border-green-200',
    EN_ATTENTE: 'bg-gray-100 text-gray-700 border-gray-200',
    RADIE: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        variants[status] || '',
      )}
    >
      {STUDENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function AttendanceStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    PRESENT: 'bg-green-100 text-green-700',
    ABSENT: 'bg-red-100 text-red-700',
    RETARD: 'bg-orange-100 text-orange-700',
    EXCUSE: 'bg-blue-100 text-blue-700',
  };
  const labels: Record<string, string> = {
    PRESENT: 'Présent',
    ABSENT: 'Absent',
    RETARD: 'Retard',
    EXCUSE: 'Excusé',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variants[status] || '',
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}

interface StudentDetailProps {
  student: StudentDetailData;
  classes: ClassOption[];
}

export function StudentDetail({ student, classes }: StudentDetailProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const initials = `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase();
  const alertThresholdReached = student.absenceCount >= ABSENCE_ALERT_THRESHOLD;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" render={<Link href="/admin/vie-scolaire/eleves" />}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Button>
          <h1 className="text-xl font-bold">
            {student.firstName} {student.lastName}
          </h1>
          <StatusChip status={student.status} />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Emploi du temps bientôt disponible.')}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Emploi du temps
          </Button>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Identité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {student.firstName} {student.lastName}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {student.matricule}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Genre" value={GENDER_LABELS_STUDENT[student.gender]} />
              <Field label="Âge" value={`${computeAge(student.dateOfBirth)} ans`} />
              <Field label="Date de naissance" value={formatDateFR(student.dateOfBirth)} />
              <Field label="Lieu de naissance" value={student.placeOfBirth} />
            </div>
            <Field label="Adresse" value={student.address} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scolarité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field
              label="Classe"
              value={
                <Badge variant="secondary">{student.classGroup.label}</Badge>
              }
            />
            <Field label="Niveau" value={student.classGroup.levelLabel} />
            <Field
              label="Professeur attitré"
              value={student.classGroup.teacherName ?? 'Non assigné'}
            />
            <Field
              label="Créneau"
              value={
                student.classGroup.schedule ? (
                  <>
                    {TIME_SLOT_LABELS[student.classGroup.schedule.timeSlot] ??
                      student.classGroup.schedule.timeSlot}
                    <span className="ml-1 text-xs text-muted-foreground">
                      {student.classGroup.schedule.startTime} -{' '}
                      {student.classGroup.schedule.endTime}
                      {student.classGroup.schedule.room
                        ? ` · ${student.classGroup.schedule.room}`
                        : ''}
                    </span>
                  </>
                ) : (
                  '—'
                )
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Famille</CardTitle>
            <Button
              variant="outline"
              size="xs"
              render={
                <Link
                  href={`/admin/vie-scolaire/parents?studentId=${student.id}&lastName=${encodeURIComponent(student.lastName)}`}
                />
              }
            >
              <UserPlus className="h-3 w-3" />
              Ajouter un parent
            </Button>
          </CardHeader>
          <CardContent>
            {student.parents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun parent lié.</p>
            ) : (
              <div className="space-y-2">
                {student.parents.map((p) => (
                  <div
                    key={p.linkId}
                    className="rounded-md border p-2.5 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/admin/vie-scolaire/parents/${p.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.firstName} {p.lastName}
                      </Link>
                      <Badge variant="outline" className="text-[10px]">
                        {RELATIONSHIP_LABELS[p.relationship] ?? p.relationship}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                    <p className="text-xs text-muted-foreground">{p.phone}</p>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="mt-1"
                      onClick={() =>
                        toast.info(
                          `Messagerie bientôt disponible (${p.firstName} ${p.lastName}).`,
                        )
                      }
                    >
                      Contacter
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Absences</CardTitle>
          {alertThresholdReached && (
            <span className="animate-pulse-alert inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              <AlertTriangle className="h-3 w-3" />
              Seuil d&apos;alerte atteint
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Absences (année)</p>
              <p className="mt-1 text-2xl font-bold">{student.absenceCount}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Retards (année)</p>
              <p className="mt-1 text-2xl font-bold">{student.lateCount}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Seuil d&apos;alerte</p>
              <p className="mt-1 text-2xl font-bold">{ABSENCE_ALERT_THRESHOLD}</p>
            </div>
          </div>

          {student.recentAttendances.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun appel enregistré.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Créneau</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Motif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.recentAttendances.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm">{formatDateFR(a.date)}</TableCell>
                      <TableCell className="text-xs">
                        {TIME_SLOT_LABELS[a.timeSlot] ?? a.timeSlot}
                      </TableCell>
                      <TableCell>
                        <AttendanceStatusBadge status={a.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.reason ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editOpen && (
        <StudentForm
          open={editOpen}
          onClose={() => {
            setEditOpen(false);
            router.refresh();
          }}
          student={{
            id: student.id,
            matricule: student.matricule,
            gender: student.gender,
            firstName: student.firstName,
            lastName: student.lastName,
            dateOfBirth: student.dateOfBirth,
            placeOfBirth: student.placeOfBirth,
            address: student.address,
            status: student.status,
            classGroupId: student.classGroup.id,
            classLabel: student.classGroup.label,
            classGender: student.classGroup.classGender,
            levelId: student.classGroup.levelId,
            levelLabel: student.classGroup.levelLabel,
          }}
          classes={classes}
        />
      )}
    </div>
  );
}
