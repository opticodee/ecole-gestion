'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createStudent, updateStudent, type StudentRow } from '@/server/actions/students';

interface ClassOption {
  id: string;
  label: string;
  classGender: string;
  capacity: number;
  studentCount: number;
  levelLabel: string;
}

interface StudentFormProps {
  open: boolean;
  onClose: () => void;
  student?: StudentRow | null;
  classes: ClassOption[];
  defaultClassId?: string;
  defaultLastName?: string;
}

export function StudentForm({
  open,
  onClose,
  student,
  classes,
  defaultClassId,
  defaultLastName,
}: StudentFormProps) {
  const isEdit = !!student;
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>(student?.gender ?? 'MALE');
  const [firstName, setFirstName] = useState(student?.firstName ?? '');
  const [lastName, setLastName] = useState(student?.lastName ?? defaultLastName ?? '');
  const [dob, setDob] = useState(
    student?.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '',
  );
  const [placeOfBirth, setPlaceOfBirth] = useState(student?.placeOfBirth ?? '');
  const [address, setAddress] = useState(student?.address ?? '');
  const [classGroupId, setClassGroupId] = useState(
    student?.classGroupId ?? defaultClassId ?? '',
  );
  const [status, setStatus] = useState<'INSCRIT' | 'EN_ATTENTE' | 'RADIE'>(
    (student?.status as 'INSCRIT' | 'EN_ATTENTE' | 'RADIE') ?? 'INSCRIT',
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const availableClasses = useMemo(() => {
    return classes.filter((c) => {
      if (c.classGender === 'MIXTE') return true;
      if (gender === 'MALE') return c.classGender === 'GARCON';
      return c.classGender === 'FILLE';
    });
  }, [classes, gender]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = {
      gender,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dob,
      placeOfBirth: placeOfBirth.trim() || undefined,
      address: address.trim() || undefined,
      classGroupId,
      status,
    };

    const result = isEdit
      ? await updateStudent(student!.id, data)
      : await createStudent(data);

    setLoading(false);

    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }

    toast.success(
      isEdit
        ? 'Élève modifié avec succès.'
        : `Élève créé (matricule ${(result as { matricule?: string }).matricule ?? ''}).`,
    );
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'élève" : 'Ajouter un élève'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Genre</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="gender"
                  value="MALE"
                  checked={gender === 'MALE'}
                  onChange={() => {
                    setGender('MALE');
                    setClassGroupId('');
                  }}
                />
                Masculin
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="gender"
                  value="FEMALE"
                  checked={gender === 'FEMALE'}
                  onChange={() => {
                    setGender('FEMALE');
                    setClassGroupId('');
                  }}
                />
                Féminin
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student-firstname">Prénom</Label>
              <Input
                id="student-firstname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-lastname">Nom</Label>
              <Input
                id="student-lastname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student-dob">Date de naissance</Label>
              <Input
                id="student-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-pob">Lieu de naissance</Label>
              <Input
                id="student-pob"
                value={placeOfBirth}
                onChange={(e) => setPlaceOfBirth(e.target.value)}
                placeholder="ex: Paris"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-address">Adresse</Label>
            <Input
              id="student-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ex: 12 rue des Lilas, 75020 Paris"
            />
          </div>

          <div className="space-y-2">
            <Label>Classe</Label>
            <Select
              value={classGroupId}
              onValueChange={(v) => v && setClassGroupId(v)}
              required
              items={availableClasses.map((c) => ({
                value: c.id,
                label: `${c.label} (${c.studentCount}/${c.capacity})${c.studentCount >= c.capacity ? ' — complet' : ''}`,
              }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir une classe" />
              </SelectTrigger>
              <SelectContent>
                {availableClasses.length === 0 ? (
                  <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                    Aucune classe disponible pour ce genre.
                  </div>
                ) : (
                  availableClasses.map((c) => {
                    const full = c.studentCount >= c.capacity;
                    return (
                      <SelectItem key={c.id} value={c.id} disabled={full && c.id !== classGroupId}>
                        {c.label} ({c.studentCount}/{c.capacity}){full ? ' — complet' : ''}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Matricule</Label>
              <Input
                value={student?.matricule ?? 'Généré à la création'}
                readOnly
                disabled
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={status}
                onValueChange={(v) => v && setStatus(v as typeof status)}
                items={[
                  { value: 'INSCRIT', label: 'Actif' },
                  { value: 'EN_ATTENTE', label: 'En attente' },
                  { value: 'RADIE', label: 'Suspendu' },
                ]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSCRIT">Actif</SelectItem>
                  <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                  <SelectItem value="RADIE">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
