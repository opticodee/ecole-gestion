'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  MessageSquare,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ParentForm } from './parent-form';
import { StudentForm } from '../students/student-form';
import type { ParentDetail as ParentDetailData } from '@/server/actions/parents';
import type { ParentRow } from '@/server/actions/parents';
import { RELATIONSHIP_LABELS } from '@/lib/formatters';

interface StudentOption {
  id: string;
  firstName: string;
  lastName: string;
  classLabel: string;
}

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
      <p className="mt-0.5 text-sm">
        {value || <span className="text-muted-foreground">—</span>}
      </p>
    </div>
  );
}

function AccountBadge({ status }: { status: string }) {
  if (status === 'ACTIVE') {
    return (
      <Badge className="bg-green-100 text-green-700 ring-green-200">
        Compte actif
      </Badge>
    );
  }
  if (status === 'INVITED') {
    return (
      <Badge className="bg-orange-100 text-orange-700 ring-orange-200">
        Invité
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-700 ring-gray-200">Non invité</Badge>
  );
}

interface ParentDetailProps {
  parent: ParentDetailData;
  students: StudentOption[];
  classes: ClassOption[];
}

export function ParentDetail({ parent, students, classes }: ParentDetailProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [addChildOpen, setAddChildOpen] = useState(false);

  const initials = `${parent.firstName[0] ?? ''}${parent.lastName[0] ?? ''}`.toUpperCase();

  // Convert ParentDetailData to ParentRow shape for ParentForm
  const parentRow: ParentRow = {
    id: parent.id,
    gender: parent.gender,
    firstName: parent.firstName,
    lastName: parent.lastName,
    email: parent.email,
    phone: parent.phone,
    address: parent.address,
    relationship: parent.relationship,
    accountStatus: parent.accountStatus,
    children: parent.children.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      classLabel: c.classLabel,
      relationship: c.relationship,
    })),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" render={<Link href="/admin/vie-scolaire/parents" />}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Button>
          <h1 className="text-xl font-bold">
            {parent.firstName} {parent.lastName}
          </h1>
          <AccountBadge status={parent.accountStatus} />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Messagerie bientôt disponible.')}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Contacter
          </Button>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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
                  {parent.firstName} {parent.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {RELATIONSHIP_LABELS[parent.relationship] ?? parent.relationship}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" value={parent.email} />
              <Field label="Téléphone" value={parent.phone} />
            </div>
            <Field label="Adresse" value={parent.address} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Enfants
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="xs" onClick={() => setEditOpen(true)}>
                <UserPlus className="h-3 w-3" />
                Lier un enfant
              </Button>
              <Button variant="outline" size="xs" onClick={() => setAddChildOpen(true)}>
                <UserPlus className="h-3 w-3" />
                Frère/Sœur
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {parent.children.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun enfant lié.</p>
            ) : (
              <div className="space-y-2">
                {parent.children.map((c) => (
                  <Link
                    key={c.linkId}
                    href={`/admin/vie-scolaire/eleves/${c.id}`}
                    className="flex items-center justify-between rounded-md border p-2.5 text-sm transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <div>
                      <p className="font-medium">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.classLabel} · {c.levelLabel}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {RELATIONSHIP_LABELS[c.relationship] ?? c.relationship}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {editOpen && (
        <ParentForm
          open={editOpen}
          onClose={() => {
            setEditOpen(false);
            router.refresh();
          }}
          parent={parentRow}
          students={students}
        />
      )}

      {addChildOpen && (
        <StudentForm
          open={addChildOpen}
          onClose={() => {
            setAddChildOpen(false);
            router.refresh();
          }}
          classes={classes}
          defaultLastName={parent.lastName}
        />
      )}
    </div>
  );
}
