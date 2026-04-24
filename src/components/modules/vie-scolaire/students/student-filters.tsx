'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toSelectItems,
} from '@/components/ui/select';

interface StudentFiltersProps {
  classes: { id: string; label: string }[];
  levels: { id: string; label: string }[];
  filterClass: string;
  onFilterClass: (v: string) => void;
  filterLevel: string;
  onFilterLevel: (v: string) => void;
  filterGender: string;
  onFilterGender: (v: string) => void;
  filterStatus: string;
  onFilterStatus: (v: string) => void;
}

export function StudentFilters({
  classes,
  levels,
  filterClass,
  onFilterClass,
  filterLevel,
  onFilterLevel,
  filterGender,
  onFilterGender,
  filterStatus,
  onFilterStatus,
}: StudentFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={filterClass}
        onValueChange={(v) => onFilterClass(!v || v === '__all__' ? '' : v)}
        items={[
          { value: '__all__', label: 'Toutes les classes' },
          ...toSelectItems(classes, 'id', 'label'),
        ]}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Toutes les classes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Toutes les classes</SelectItem>
          {classes.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filterLevel}
        onValueChange={(v) => onFilterLevel(!v || v === '__all__' ? '' : v)}
        items={[
          { value: '__all__', label: 'Tous les niveaux' },
          ...toSelectItems(levels, 'id', 'label'),
        ]}
      >
        <SelectTrigger className="w-[160px]">
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
        onValueChange={(v) => onFilterGender(!v || v === '__all__' ? '' : v)}
        items={[
          { value: '__all__', label: 'Tous genres' },
          { value: 'MALE', label: 'Masculin' },
          { value: 'FEMALE', label: 'Féminin' },
        ]}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Tous genres" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tous genres</SelectItem>
          <SelectItem value="MALE">Masculin</SelectItem>
          <SelectItem value="FEMALE">Féminin</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filterStatus}
        onValueChange={(v) => onFilterStatus(!v || v === '__all__' ? '' : v)}
        items={[
          { value: '__all__', label: 'Tous statuts' },
          { value: 'INSCRIT', label: 'Actif' },
          { value: 'EN_ATTENTE', label: 'En attente' },
          { value: 'RADIE', label: 'Suspendu' },
        ]}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Tous statuts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tous statuts</SelectItem>
          <SelectItem value="INSCRIT">Actif</SelectItem>
          <SelectItem value="EN_ATTENTE">En attente</SelectItem>
          <SelectItem value="RADIE">Suspendu</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
