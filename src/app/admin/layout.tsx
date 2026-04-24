import { requireAuth } from '@/lib/auth-utils';
import { SessionProvider } from '@/components/providers/session-provider';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return <SessionProvider>{children}</SessionProvider>;
}
