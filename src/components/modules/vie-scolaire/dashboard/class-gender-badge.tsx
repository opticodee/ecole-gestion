import { cn } from '@/lib/utils';

export function ClassGenderBadge({ gender }: { gender: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    GARCON: {
      label: 'Garçons',
      cls: 'border-blue-200 bg-blue-100 text-blue-700',
    },
    FILLE: {
      label: 'Filles',
      cls: 'border-pink-200 bg-pink-100 text-pink-700',
    },
    MIXTE: {
      label: 'Mixte',
      cls: 'border-violet-200 bg-violet-100 text-violet-700',
    },
  };
  const c = map[gender] ?? map.MIXTE;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
        c.cls,
      )}
    >
      {c.label}
    </span>
  );
}
