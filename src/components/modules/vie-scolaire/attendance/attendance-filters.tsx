'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toSelectItems,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AttendanceClassOption } from '@/server/actions/attendance';

export type AttendanceStatusFilter = '' | 'WITH_ABSENCES' | 'FULL_PRESENT';

interface AttendanceFiltersProps {
  classes: AttendanceClassOption[];
  filterClass: string;
  onFilterClass: (v: string) => void;
  filterStatus: AttendanceStatusFilter;
  onFilterStatus: (v: AttendanceStatusFilter) => void;
  dateFrom: string;
  onDateFrom: (v: string) => void;
  dateTo: string;
  onDateTo: (v: string) => void;
}

export function AttendanceFilters({
  classes,
  filterClass,
  onFilterClass,
  filterStatus,
  onFilterStatus,
  dateFrom,
  onDateFrom,
  dateTo,
  onDateTo,
}: AttendanceFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Classe</Label>
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
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Statut</Label>
        <Select
          value={filterStatus}
          onValueChange={(v) => {
            const val = String(v ?? '');
            onFilterStatus(
              !val || val === '__all__' ? '' : (val as AttendanceStatusFilter),
            );
          }}
          items={[
            { value: '__all__', label: 'Tous' },
            { value: 'WITH_ABSENCES', label: 'Avec absences' },
            { value: 'FULL_PRESENT', label: 'Présence complète' },
          ]}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tous</SelectItem>
            <SelectItem value="WITH_ABSENCES">Avec absences</SelectItem>
            <SelectItem value="FULL_PRESENT">Présence complète</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Du</Label>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFrom(e.target.value)}
          className="w-[150px]"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Au</Label>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onDateTo(e.target.value)}
          className="w-[150px]"
        />
      </div>
    </div>
  );
}
