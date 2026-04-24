'use client';

import { useState } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';
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
  createUser,
  generateRandomPassword,
  updateUser,
  type UserRow,
} from '@/server/actions/users';

const ROLE_ITEMS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DIRECTEUR', label: 'Directeur' },
  { value: 'PROFESSEUR', label: 'Professeur' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  user?: UserRow | null;
}

export function UserForm({ open, onClose, user }: Props) {
  const isEdit = !!user;
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState<'ADMIN' | 'DIRECTEUR' | 'PROFESSEUR'>(
    (user?.role as 'ADMIN' | 'DIRECTEUR' | 'PROFESSEUR') ?? 'PROFESSEUR',
  );
  const [password, setPassword] = useState('');
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    const pwd = await generateRandomPassword();
    setPassword(pwd);
  }

  async function copyPassword(pwd: string) {
    try {
      await navigator.clipboard.writeText(pwd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Impossible de copier dans le presse-papiers.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isEdit) {
      const result = await updateUser(user!.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role,
      });
      setLoading(false);
      if ('error' in result && result.error) {
        setError(result.error);
        return;
      }
      toast.success('Utilisateur modifié avec succès.');
      onClose();
      return;
    }

    if (!password || password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      setLoading(false);
      return;
    }

    const result = await createUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      role,
      password,
    });
    setLoading(false);
    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }
    toast.success('Utilisateur créé avec succès.');
    // Show password screen once
    setCreatedPassword(password);
  }

  if (createdPassword) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Utilisateur créé</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Communiquez ce mot de passe à l&apos;utilisateur. Il pourra le
              changer depuis son profil. <strong>Ce mot de passe ne sera
              affiché qu&apos;une seule fois.</strong>
            </p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
              <code className="flex-1 font-mono text-sm">{createdPassword}</code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyPassword(createdPassword)}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copié
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copier
                  </>
                )}
              </Button>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={onClose}>
                Terminé
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'utilisateur" : 'Ajouter un utilisateur'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-firstname">Prénom *</Label>
              <Input
                id="user-firstname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-lastname">Nom *</Label>
              <Input
                id="user-lastname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">Email *</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="prenom.nom@ecole.fr"
            />
          </div>

          <div className="space-y-2">
            <Label>Rôle *</Label>
            <Select
              value={role}
              onValueChange={(v) =>
                setRole(v as 'ADMIN' | 'DIRECTEUR' | 'PROFESSEUR')
              }
              items={ROLE_ITEMS}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_ITEMS.map((it) => (
                  <SelectItem key={it.value} value={it.value}>
                    {it.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="user-password">Mot de passe temporaire *</Label>
              <div className="flex gap-2">
                <Input
                  id="user-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  required
                  minLength={8}
                />
                <Button type="button" variant="outline" onClick={generate}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Générer
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Le mot de passe sera affiché une seule fois après création.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
