import Link from 'next/link';
import { BookOpen, ClipboardList, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateFR } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface RecentItem {
  kind: 'COURSE' | 'HOMEWORK';
  id: string;
  title: string;
  classLabel: string;
  createdAt: string;
  href: string;
}

export function RecentActivity({ items }: { items: RecentItem[] }) {
  return (
    <Card className="border border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Aucune activité récente.
          </p>
        ) : (
          <ol className="relative space-y-1 pl-6">
            <span
              aria-hidden
              className="absolute left-[14px] top-2 bottom-2 w-px bg-border"
            />
            {items.map((item) => {
              const isCourse = item.kind === 'COURSE';
              return (
                <li key={`${item.kind}-${item.id}`} className="relative">
                  <Link
                    href={item.href}
                    className="group flex items-center gap-3 rounded-md py-2 pl-2 pr-3 transition-colors hover:bg-muted/60"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'absolute -left-[18px] top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full ring-4 ring-background',
                        isCourse
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
                      )}
                    >
                      {isCourse ? (
                        <BookOpen className="h-3.5 w-3.5" />
                      ) : (
                        <ClipboardList className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-primary">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {isCourse ? 'Contenu de cours' : 'Devoir'} · {item.classLabel}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatDateFR(item.createdAt)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
