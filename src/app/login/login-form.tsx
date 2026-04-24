'use client';

import { useState } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Destination après connexion selon le rôle.
 * TODO: rediriger PROFESSEUR vers /prof et PARENT vers /parent quand ces
 * espaces dédiés seront créés. Pour l'instant tous les rôles vont sur
 * /admin/modules — le routing côté pages filtre l'accès par rôle.
 */
function destinationForRole(role: string | undefined): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
    case 'DIRECTEUR':
      return '/admin/modules';
    case 'PROFESSEUR':
      return '/admin/modules'; // TODO: '/prof'
    case 'PARENT':
      return '/admin/modules'; // TODO: '/parent'
    default:
      return '/admin/modules';
  }
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Veuillez saisir votre email.');
      return;
    }
    if (!password) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }

    setLoading(true);

    const result = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setLoading(false);
      setError('Email ou mot de passe incorrect.');
      return;
    }

    // Récupère la session fraîche pour router selon le rôle.
    const session = await getSession();
    const destination = destinationForRole(session?.user?.role);

    setLoading(false);
    router.push(destination);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="prenom.nom@acmschool.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Mot de passe
            </Label>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              Mot de passe oublié ?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              tabIndex={-1}
              aria-label={showPassword ? 'Masquer' : 'Afficher'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          className="h-11 w-full text-sm font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connexion...
            </>
          ) : (
            'Se connecter'
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Parents, enseignants ou administration — un seul accès pour tous.
      </p>
    </div>
  );
}
