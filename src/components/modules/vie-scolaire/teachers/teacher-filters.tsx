'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  filterStatus: string;
  onFilterStatus: (v: string) => void;
}

export function TeacherFilters({ filterStatus, onFilterStatus }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={filterStatus}
        onValueChange={(v) => onFilterStatus(!v || v === '__all__' ? '' : v)}
        items={[
          { value: '__all__', label: 'Tous statuts' },
          { value: 'ACTIVE', label: 'Actif' },
          { value: 'INACTIVE', label: 'Inactif' },
        ]}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Tous statuts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tous statuts</SelectItem>
          <SelectItem value="ACTIVE">Actif</SelectItem>
          <SelectItem value="INACTIVE">Inactif</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
