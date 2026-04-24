'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toSelectItems,
} from '@/components/ui/select';

interface ClassOption {
  id: string;
  label: string;
}
interface TeacherOption {
  id: string;
  name: string;
}

interface CourseContentFiltersProps {
  classes: ClassOption[];
  teachers: TeacherOption[];
  filterClass: string;
  onFilterClass: (v: string) => void;
  filterTeacher: string;
  onFilterTeacher: (v: string) => void;
  filterPeriod: string;
  onFilterPeriod: (v: string) => void;
}

export function CourseContentFilters({
  classes,
  teachers,
  filterClass,
  onFilterClass,
  filterTeacher,
  onFilterTeacher,
  filterPeriod,
  onFilterPeriod,
}: CourseContentFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={filterClass}
        onValueChange={(v) => onFilterClass(!v || v === '__all__' ? '' : v)}
        items={[
          { value: '__all__', label: 'Toutes classes' },
          ...toSelectItems(classes, 'id', 'label'),
        ]}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Toutes classes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Toutes classes</SelectItem>
          {classes.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filterTeacher}
        onValueChange={(v) => onFilterTeacher(!v || v === '__all__' ? '' : v)}
        items={[
          { value: '__all__', label: 'Tous professeurs' },
          ...toSelectItems(teachers, 'id', 'name'),
        ]}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tous professeurs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tous professeurs</SelectItem>
          {teachers.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filterPeriod}
        onValueChange={(v) => onFilterPeriod(!v || v === '__all__' ? '' : v)}
        items={[
          { value: '__all__', label: 'Toutes périodes' },
          { value: '7', label: '7 derniers jours' },
          { value: '30', label: '30 derniers jours' },
          { value: '90', label: '3 derniers mois' },
        ]}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Toutes périodes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Toutes périodes</SelectItem>
          <SelectItem value="7">7 derniers jours</SelectItem>
          <SelectItem value="30">30 derniers jours</SelectItem>
          <SelectItem value="90">3 derniers mois</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
