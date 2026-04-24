import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DIRECTEUR' | 'PROFESSEUR' | 'PERSONNEL' | 'PARENT';

export function hasRole(userRole: string, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole as UserRole);
}

export function isAdmin(role: string): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function isDirecteur(role: string): boolean {
  return role === 'DIRECTEUR';
}

export function isProf(role: string): boolean {
  return role === 'PROFESSEUR';
}

export function isAdminOrDirecteur(role: string): boolean {
  return isAdmin(role) || isDirecteur(role);
}

/**
 * Server-side: get the authenticated session or redirect to /login.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  return session;
}

/**
 * Server-side: get the authenticated session and check role, or redirect.
 */
export async function requireRole(...allowedRoles: UserRole[]) {
  const session = await requireAuth();
  if (!hasRole(session.user.role, allowedRoles)) {
    redirect('/admin/modules');
  }
  return session;
}
