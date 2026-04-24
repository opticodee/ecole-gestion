'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toSelectItems,
} from '@/components/ui/select';

interface Option {
  id: string;
  label: string;
}
interface TeacherOption {
  id: string;
  name: string;
}

interface EvaluationFiltersProps {
  classes: Option[];
  subjects: Option[];
  teachers: TeacherOption[];
  filterClass: string;
  onFilterClass: (v: string) => void;
  filterSubject: string;
  onFilterSubject: (v: string) => void;
  filterTeacher: string;
  onFilterTeacher: (v: string) => void;
  filterType: string;
  onFilterType: (v: string) => void;
  filterStatus: string;
  onFilterStatus: (v: string) => void;
}

export function EvaluationFilters({
  classes,
  subjects,
  teachers,
  filterClass,
  onFilterClass,
  filterSubject,
  onFilterSubject,
  filterTeacher,
  onFilterTeacher,
  filterType,
  onFilterType,
  filterStatus,
  onFilterStatus,
}: EvaluationFiltersProps) {
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
        value={filterSubject}
        onValueChange={(v) => onFilterSubject(!v || v === '__all__' ? '' : v)}
        items={[
          { value: '__all__', label: 'Toutes matières' },
          ...toSelectItems(subjects, 'id', 'label'),
        ]}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Toutes matières" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Toutes matières</SelectItem>
          {subjects.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filterTeacher}
        onValueChange={(v) => onFilterTeacher(!v || v === '__all__' ? '' : v)}
        items={[
          { value: '__all__', label: 'Tous enseignants' },
          ...toSelectItems(teachers, 'id', 'name'),
        ]}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tous enseignants" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tous enseignants</SelectItem>
          {teachers.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filterType}
        onValueChange={(v) => onFilterType(!v || v === '__all__' ? '' : v)}
        items={[
          { value: '__all__', label: 'Tous types' },
          { value: 'CONTROLE', label: 'Contrôle' },
          { value: 'EXAMEN', label: 'Examen' },
        ]}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Tous types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tous types</SelectItem>
          <SelectItem value="CONTROLE">Contrôle</SelectItem>
          <SelectItem value="EXAMEN">Examen</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filterStatus}
        onValueChange={(v) => onFilterStatus(!v || v === '__all__' ? '' : v)}
        items={[
          { value: '__all__', label: 'Tous statuts' },
          { value: 'OPEN', label: 'En cours' },
          { value: 'LOCKED', label: 'Verrouillé' },
        ]}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Tous statuts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tous statuts</SelectItem>
          <SelectItem value="OPEN">En cours</SelectItem>
          <SelectItem value="LOCKED">Verrouillé</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
