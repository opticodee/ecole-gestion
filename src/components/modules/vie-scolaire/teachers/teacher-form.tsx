'use client';

import { useState } from 'react';
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
import {
  createTeacher,
  updateTeacher,
  type TeacherRow,
} from '@/server/actions/teachers';

interface Props {
  open: boolean;
  onClose: () => void;
  teacher?: TeacherRow | null;
}

export function TeacherForm({ open, onClose, teacher }: Props) {
  const isEdit = !!teacher;
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>(
    (teacher?.gender as 'MALE' | 'FEMALE') ?? 'MALE',
  );
  const [firstName, setFirstName] = useState(teacher?.firstName ?? '');
  const [lastName, setLastName] = useState(teacher?.lastName ?? '');
  const [email, setEmail] = useState(teacher?.email ?? '');
  const [phone, setPhone] = useState(teacher?.phone ?? '');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [specialization, setSpecialization] = useState(teacher?.specialization ?? '');
  const [isActive, setIsActive] = useState<boolean>(teacher?.isActive ?? true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = {
      gender,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      dateOfBirth: dob || undefined,
      specialization: specialization.trim() || undefined,
      isActive,
    };

    const result = isEdit
      ? await updateTeacher(teacher!.id, data)
      : await createTeacher(data);
    setLoading(false);

    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }

    toast.success(
      isEdit ? 'Enseignant modifié avec succès.' : 'Enseignant créé avec succès.',
    );
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'enseignant" : 'Ajouter un enseignant'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Genre</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="teacher-gender"
                  value="MALE"
                  checked={gender === 'MALE'}
                  onChange={() => setGender('MALE')}
                />
                Masculin
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="teacher-gender"
                  value="FEMALE"
                  checked={gender === 'FEMALE'}
                  onChange={() => setGender('FEMALE')}
                />
                Féminin
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teacher-firstname">Prénom</Label>
              <Input
                id="teacher-firstname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher-lastname">Nom</Label>
              <Input
                id="teacher-lastname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teacher-email">Email</Label>
              <Input
                id="teacher-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="prof@ecole.fr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher-phone">Téléphone</Label>
              <Input
                id="teacher-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher-address">Adresse</Label>
            <Input
              id="teacher-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ex: 12 rue des Lilas, 75020 Paris"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teacher-dob">Date de naissance</Label>
              <Input
                id="teacher-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={isActive ? 'ACTIVE' : 'INACTIVE'}
                onValueChange={(v) => setIsActive(v === 'ACTIVE')}
                items={[
                  { value: 'ACTIVE', label: 'Actif' },
                  { value: 'INACTIVE', label: 'Inactif' },
                ]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Actif</SelectItem>
                  <SelectItem value="INACTIVE">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher-specialization">Spécialité / Matières (indicatif)</Label>
            <Input
              id="teacher-specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="ex: Coran et Tajwid"
            />
            <p className="text-[10px] text-muted-foreground">
              Dans ce modèle, un enseignant enseigne toutes les matières à sa classe. Ce champ est purement indicatif.
            </p>
          </div>

          {!isEdit && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-2.5 text-xs text-blue-800">
              Un compte utilisateur PROFESSEUR sera créé avec le mot de passe temporaire{' '}
              <code className="rounded bg-blue-100 px-1 font-mono">ChangeMe2026!</code>.
              L&apos;enseignant le modifiera à la réception de son email d&apos;invitation.
            </div>
          )}

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
