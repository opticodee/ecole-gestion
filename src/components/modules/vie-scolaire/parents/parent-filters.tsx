'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ParentFiltersProps {
  filterRelation: string;
  onFilterRelation: (v: string) => void;
  filterAccountStatus: string;
  onFilterAccountStatus: (v: string) => void;
}

export function ParentFilters({
  filterRelation,
  onFilterRelation,
  filterAccountStatus,
  onFilterAccountStatus,
}: ParentFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={filterRelation}
        onValueChange={(v) => onFilterRelation(!v || v === '__all__' ? '' : v)}
        items={[
          { value: '__all__', label: 'Toutes relations' },
          { value: 'PERE', label: 'Père' },
          { value: 'MERE', label: 'Mère' },
          { value: 'TUTEUR', label: 'Tuteur' },
          { value: 'AUTRE', label: 'Autre' },
        ]}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Toutes relations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Toutes relations</SelectItem>
          <SelectItem value="PERE">Père</SelectItem>
          <SelectItem value="MERE">Mère</SelectItem>
          <SelectItem value="TUTEUR">Tuteur</SelectItem>
          <SelectItem value="AUTRE">Autre</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filterAccountStatus}
        onValueChange={(v) => onFilterAccountStatus(!v || v === '__all__' ? '' : v)}
        items={[
          { value: '__all__', label: 'Tous comptes' },
          { value: 'ACTIVE', label: 'Actif' },
          { value: 'INVITED', label: 'Invité' },
          { value: 'NONE', label: 'Non invité' },
        ]}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Tous comptes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tous comptes</SelectItem>
          <SelectItem value="ACTIVE">Actif</SelectItem>
          <SelectItem value="INVITED">Invité</SelectItem>
          <SelectItem value="NONE">Non invité</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
