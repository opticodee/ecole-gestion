'use client';

import { useMemo, useState } from 'react';
import { X, Link as LinkIcon } from 'lucide-react';
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
  createParent,
  updateParent,
  linkChild,
  unlinkChild,
  type ParentRow,
} from '@/server/actions/parents';

interface StudentOption {
  id: string;
  firstName: string;
  lastName: string;
  classLabel: string;
}

interface ParentFormProps {
  open: boolean;
  onClose: () => void;
  parent?: ParentRow | null;
  students: StudentOption[];
  defaultChildId?: string;
  defaultLastName?: string;
}

export function ParentForm({
  open,
  onClose,
  parent,
  students,
  defaultChildId,
  defaultLastName,
}: ParentFormProps) {
  const isEdit = !!parent;

  const [gender, setGender] = useState<'MALE' | 'FEMALE'>(parent?.gender ?? 'MALE');
  const [firstName, setFirstName] = useState(parent?.firstName ?? '');
  const [lastName, setLastName] = useState(parent?.lastName ?? defaultLastName ?? '');
  const [email, setEmail] = useState(parent?.email ?? '');
  const [phone, setPhone] = useState(parent?.phone ?? '');
  const [address, setAddress] = useState(parent?.address ?? '');
  const [relationship, setRelationship] = useState<'PERE' | 'MERE' | 'TUTEUR' | 'AUTRE'>(
    (parent?.relationship as 'PERE' | 'MERE' | 'TUTEUR' | 'AUTRE') ?? 'PERE',
  );
  const [linkedIds, setLinkedIds] = useState<string[]>(
    parent?.children.map((c) => c.id) ?? (defaultChildId ? [defaultChildId] : []),
  );
  const [pendingChildId, setPendingChildId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const availableStudents = useMemo(
    () => students.filter((s) => !linkedIds.includes(s.id)),
    [students, linkedIds],
  );

  const linkedStudents = useMemo(() => {
    return linkedIds
      .map((id) => students.find((s) => s.id === id))
      .filter((s): s is StudentOption => !!s);
  }, [linkedIds, students]);

  async function handleAddLink() {
    if (!pendingChildId) return;
    if (isEdit && parent) {
      const res = await linkChild(parent.id, pendingChildId, relationship);
      if ('error' in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success('Enfant lié.');
    }
    setLinkedIds((prev) => [...prev, pendingChildId]);
    setPendingChildId('');
  }

  async function handleUnlink(studentId: string) {
    if (isEdit && parent) {
      const res = await unlinkChild(parent.id, studentId);
      if ('error' in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success('Enfant délié.');
    }
    setLinkedIds((prev) => prev.filter((id) => id !== studentId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = {
      gender,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      relationship,
      childIds: linkedIds,
    };

    const result = isEdit
      ? await updateParent(parent!.id, data)
      : await createParent(data);

    setLoading(false);

    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }

    toast.success(isEdit ? 'Parent modifié.' : 'Parent créé.');
    if (!isEdit && linkedIds.length === 0) {
      toast.warning('Aucun enfant lié à ce parent.');
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier le parent' : 'Ajouter un parent'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Genre</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="parent-gender"
                  value="MALE"
                  checked={gender === 'MALE'}
                  onChange={() => setGender('MALE')}
                />
                Masculin
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="parent-gender"
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
              <Label htmlFor="parent-firstname">Prénom</Label>
              <Input
                id="parent-firstname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent-lastname">Nom</Label>
              <Input
                id="parent-lastname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parent-email">Email (identifiant)</Label>
              <Input
                id="parent-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent-phone">Téléphone</Label>
              <Input
                id="parent-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06 12 34 56 78"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent-address">Adresse</Label>
            <Input
              id="parent-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Relation avec l&apos;élève</Label>
            <Select
              value={relationship}
              onValueChange={(v) => v && setRelationship(v as typeof relationship)}
              items={[
                { value: 'PERE', label: 'Père' },
                { value: 'MERE', label: 'Mère' },
                { value: 'TUTEUR', label: 'Tuteur' },
                { value: 'AUTRE', label: 'Autre' },
              ]}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERE">Père</SelectItem>
                <SelectItem value="MERE">Mère</SelectItem>
                <SelectItem value="TUTEUR">Tuteur</SelectItem>
                <SelectItem value="AUTRE">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <Label>Enfants liés</Label>
            {linkedStudents.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucun enfant lié.</p>
            ) : (
              <ul className="space-y-1">
                {linkedStudents.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-md bg-background px-2 py-1 text-sm"
                  >
                    <span>
                      {s.firstName} {s.lastName}{' '}
                      <span className="text-xs text-muted-foreground">({s.classLabel})</span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleUnlink(s.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2">
              <Select
                value={pendingChildId}
                onValueChange={(v) => setPendingChildId(v ?? '')}
                items={availableStudents.map((s) => ({
                  value: s.id,
                  label: `${s.firstName} ${s.lastName} — ${s.classLabel}`,
                }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un élève..." />
                </SelectTrigger>
                <SelectContent>
                  {availableStudents.length === 0 ? (
                    <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                      Aucun élève disponible.
                    </div>
                  ) : (
                    availableStudents.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} — {s.classLabel}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddLink}
                disabled={!pendingChildId}
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Lier
              </Button>
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
