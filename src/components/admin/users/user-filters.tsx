'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ROLE_ITEMS = [
  { value: 'ALL', label: 'Tous les rôles' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DIRECTEUR', label: 'Directeur' },
  { value: 'PROFESSEUR', label: 'Professeur' },
  { value: 'PARENT', label: 'Parent' },
];

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Tous les statuts' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INVITED', label: 'Invité' },
  { value: 'INACTIVE', label: 'Inactif' },
];

export function UserFilters({
  filterRole,
  onFilterRole,
  filterStatus,
  onFilterStatus,
}: {
  filterRole: string;
  onFilterRole: (v: string) => void;
  filterStatus: string;
  onFilterStatus: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={filterRole || 'ALL'}
        onValueChange={(v) => onFilterRole(v === 'ALL' || !v ? '' : (v as string))}
        items={ROLE_ITEMS}
      >
        <SelectTrigger className="w-40">
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

      <Select
        value={filterStatus || 'ALL'}
        onValueChange={(v) => onFilterStatus(v === 'ALL' || !v ? '' : (v as string))}
        items={STATUS_ITEMS}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_ITEMS.map((it) => (
            <SelectItem key={it.value} value={it.value}>
              {it.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
