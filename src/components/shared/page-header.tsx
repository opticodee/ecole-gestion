import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function PageHeader({ title, actionLabel, onAction }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          <Plus className="mr-1.5 h-4 w-4" data-icon="inline-start" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
