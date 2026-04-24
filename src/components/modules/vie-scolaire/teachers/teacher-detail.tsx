'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  FileCheck,
  GraduationCap,
  Pencil,
  TrendingUp,
  Users,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { formatDateFR, GENDER_LABELS_STUDENT } from '@/lib/formatters';
import { TIME_SLOT_LABELS, TIME_SLOTS, GENDER_LABELS } from '@/lib/time-slots';
import type { TeacherDetail as Data } from '@/server/actions/teachers';
import { TeacherForm } from './teacher-form';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">
        {value || <span className="text-muted-foreground">—</span>}
      </p>
    </div>
  );
}

function StatusChip({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        active
          ? 'border-green-200 bg-green-100 text-green-700'
          : 'border-gray-200 bg-gray-100 text-gray-600',
      )}
    >
      {active ? 'Actif' : 'Inactif'}
    </span>
  );
}

function ClassGenderBadge({ classGender }: { classGender: string }) {
  const variants: Record<string, string> = {
    FILLE: 'bg-pink-100 text-pink-700',
    GARCON: 'bg-blue-100 text-blue-700',
    MIXTE: 'bg-purple-100 text-purple-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
        variants[classGender] || '',
      )}
    >
      {GENDER_LABELS[classGender] ?? classGender}
    </span>
  );
}

export function TeacherDetail({ teacher }: { teacher: Data }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const initials = `${teacher.firstName[0] ?? ''}${teacher.lastName[0] ?? ''}`.toUpperCase();

  // Build schedule grid keyed by TimeSlot
  const scheduleByTimeSlot = new Map<string, Data['classes'][number]>();
  for (const c of teacher.classes) {
    if (c.schedule) scheduleByTimeSlot.set(c.schedule.timeSlot, c);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/admin/vie-scolaire/enseignants" />}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Button>
          <h1 className="text-xl font-bold">
            {teacher.firstName} {teacher.lastName}
          </h1>
          <StatusChip active={teacher.isActive} />
        </div>
        <Button size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Modifier
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {teacher.firstName} {teacher.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{teacher.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Genre"
                value={teacher.gender ? GENDER_LABELS_STUDENT[teacher.gender] : null}
              />
              <Field
                label="Date de naissance"
                value={teacher.dateOfBirth ? formatDateFR(teacher.dateOfBirth) : null}
              />
              <Field label="Téléphone" value={teacher.phone} />
              <Field
                label="Embauché(e) le"
                value={teacher.hireDate ? formatDateFR(teacher.hireDate) : null}
              />
            </div>
            <Field label="Adresse" value={teacher.address} />
            <Field label="Spécialité / Matières" value={teacher.specialization} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  Élèves enseignés
                </div>
                <p className="mt-1 text-2xl font-bold">{teacher.stats.totalStudents}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileCheck className="h-3.5 w-3.5" />
                  Évaluations créées
                </div>
                <p className="mt-1 text-2xl font-bold">{teacher.stats.evaluationCount}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Taux de présence moyen
                </div>
                <p className="mt-1 text-2xl font-bold">
                  {teacher.stats.presenceRate === null
                    ? '—'
                    : `${teacher.stats.presenceRate}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compte utilisateur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Email" value={teacher.email} />
            <Field label="Rôle" value={<Badge variant="secondary">PROFESSEUR</Badge>} />
            <Field
              label="Dernière connexion"
              value={teacher.lastLoginAt ? formatDateFR(teacher.lastLoginAt) : 'Jamais'}
            />
            <Field label="Créé le" value={formatDateFR(teacher.createdAt)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Classes assignées ({teacher.classes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teacher.classes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune classe assignée à cet enseignant.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/5">
                    <TableHead>Classe</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Créneau</TableHead>
                    <TableHead>Salle</TableHead>
                    <TableHead className="text-right">Élèves</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacher.classes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <Link
                          href="/admin/vie-scolaire/classes"
                          className="hover:underline"
                        >
                          {c.label}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{c.levelLabel}</TableCell>
                      <TableCell>
                        <ClassGenderBadge classGender={c.classGender} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.schedule ? (
                          <>
                            {TIME_SLOT_LABELS[c.schedule.timeSlot] ?? c.schedule.timeSlot}
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({c.schedule.startTime} – {c.schedule.endTime})
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.schedule?.room ?? '—'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {c.studentCount} / {c.capacity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Emploi du temps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead>Créneau</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Horaires</TableHead>
                  <TableHead>Salle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TIME_SLOTS.map((slot) => {
                  const c = scheduleByTimeSlot.get(slot);
                  return (
                    <TableRow key={slot}>
                      <TableCell className="font-medium">
                        {TIME_SLOT_LABELS[slot] ?? slot}
                      </TableCell>
                      <TableCell>
                        {c ? (
                          <Link
                            href="/admin/vie-scolaire/classes"
                            className="hover:underline"
                          >
                            <Badge variant="secondary">{c.label}</Badge>
                          </Link>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">
                            Libre
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c?.schedule
                          ? `${c.schedule.startTime} – ${c.schedule.endTime}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c?.schedule?.room ?? '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editOpen && (
        <TeacherForm
          open={editOpen}
          onClose={() => {
            setEditOpen(false);
            router.refresh();
          }}
          teacher={{
            id: teacher.id,
            userId: teacher.userId,
            gender: teacher.gender,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            email: teacher.email,
            phone: teacher.phone,
            specialization: teacher.specialization,
            isActive: teacher.isActive,
            classes: teacher.classes.map((c) => ({
              id: c.id,
              label: c.label,
              classGender: c.classGender,
            })),
            classCount: teacher.classes.length,
          }}
        />
      )}
    </div>
  );
}
