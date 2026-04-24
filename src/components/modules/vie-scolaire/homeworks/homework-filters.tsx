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

interface HomeworkFiltersProps {
  classes: ClassOption[];
  teachers: TeacherOption[];
  filterClass: string;
  onFilterClass: (v: string) => void;
  filterTeacher: string;
  onFilterTeacher: (v: string) => void;
  filterStatus: string;
  onFilterStatus: (v: string) => void;
}

export function HomeworkFilters({
  classes,
  teachers,
  filterClass,
  onFilterClass,
  filterTeacher,
  onFilterTeacher,
  filterStatus,
  onFilterStatus,
}: HomeworkFiltersProps) {
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
        value={filterStatus}
        onValueChange={(v) => onFilterStatus(!v || v === '__all__' ? '' : v)}
        items={[
          { value: '__all__', label: 'Tous statuts' },
          { value: 'A_VENIR', label: 'À venir' },
          { value: 'AUJOURD_HUI', label: "Aujourd'hui" },
          { value: 'EN_RETARD', label: 'En retard' },
        ]}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Tous statuts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tous statuts</SelectItem>
          <SelectItem value="A_VENIR">À venir</SelectItem>
          <SelectItem value="AUJOURD_HUI">Aujourd&apos;hui</SelectItem>
          <SelectItem value="EN_RETARD">En retard</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
