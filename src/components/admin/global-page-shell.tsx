'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AdminHeader } from './admin-header';
import { Button } from '@/components/ui/button';

interface AdminUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export function GlobalPageShell({
  user,
  title,
  description,
  children,
}: {
  user: AdminUser;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <AdminHeader user={user} />
      <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit px-2 text-muted-foreground hover:text-foreground"
              render={<Link href="/admin/modules" />}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux modules
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
                {title}
              </h1>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
