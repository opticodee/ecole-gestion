'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toSelectItems,
} from '@/components/ui/select';

interface ClassFiltersProps {
  levels: { id: string; label: string }[];
  filterLevel: string;
  onFilterLevel: (value: string) => void;
  filterGender: string;
  onFilterGender: (value: string) => void;
}

export function ClassFilters({
  levels,
  filterLevel,
  onFilterLevel,
  filterGender,
  onFilterGender,
}: ClassFiltersProps) {
  return (
    <div className="flex gap-2">
      <Select
        value={filterLevel}
        onValueChange={(val) => onFilterLevel(!val || val === '__all__' ? '' : val)}
        items={[
          { value: '__all__', label: 'Tous les niveaux' },
          ...toSelectItems(levels, 'id', 'label'),
        ]}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tous les niveaux" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tous les niveaux</SelectItem>
          {levels.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filterGender}
        onValueChange={(val) => onFilterGender(!val || val === '__all__' ? '' : val)}
        items={[
          { value: '__all__', label: 'Tous genres' },
          { value: 'FILLE', label: 'Filles' },
          { value: 'GARCON', label: 'Garçons' },
          { value: 'MIXTE', label: 'Mixte' },
        ]}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Tous genres" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tous genres</SelectItem>
          <SelectItem value="FILLE">Filles</SelectItem>
          <SelectItem value="GARCON">Garçons</SelectItem>
          <SelectItem value="MIXTE">Mixte</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
