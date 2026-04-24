'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toSelectItems,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createClass, updateClass, type ClassRow } from '@/server/actions/classes';
import { TIME_SLOTS } from '@/lib/time-slots';

const TIME_SLOT_LABELS: Record<string, string> = {
  MERCREDI_PM: 'Mercredi après-midi',
  SAMEDI_AM: 'Samedi matin',
  SAMEDI_PM: 'Samedi après-midi',
  DIMANCHE_AM: 'Dimanche matin',
  DIMANCHE_PM: 'Dimanche après-midi',
};

interface ClassFormProps {
  open: boolean;
  onClose: () => void;
  classRow?: ClassRow | null;
  teachers: { id: string; name: string }[];
  levels: { id: string; label: string }[];
}

export function ClassForm({ open, onClose, classRow, teachers, levels }: ClassFormProps) {
  const isEdit = !!classRow;

  const [label, setLabel] = useState(classRow?.label ?? '');
  const [levelId, setLevelId] = useState(classRow?.levelId ?? '');
  const [classGender, setClassGender] = useState(classRow?.classGender ?? 'GARCON');
  const [periodType, setPeriodType] = useState(classRow?.periodType ?? 'TRIMESTRE');
  const [capacity, setCapacity] = useState(classRow?.capacity?.toString() ?? '15');
  const [teacherId, setTeacherId] = useState(classRow?.teacherId ?? '');
  const [timeSlot, setTimeSlot] = useState(classRow?.schedule?.timeSlot ?? 'SAMEDI_AM');
  const [startTime, setStartTime] = useState(classRow?.schedule?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(classRow?.schedule?.endTime ?? '12:00');
  const [room, setRoom] = useState(classRow?.room ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = {
      label: label.trim(),
      levelId,
      classGender,
      periodType,
      capacity: Number(capacity),
      teacherId: (teacherId && teacherId !== '__none__') ? teacherId : undefined,
      timeSlot,
      startTime,
      endTime,
      room: room.trim() || undefined,
    };

    const result = isEdit
      ? await updateClass(classRow!.id, data)
      : await createClass(data);

    setLoading(false);

    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }

    toast.success(isEdit ? 'Classe modifiée avec succès.' : 'Classe créée avec succès.');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier la classe' : 'Ajouter une classe'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="class-label">Libellé</Label>
            <Input
              id="class-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: Coran N1 - Garçons A"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Niveau</Label>
              <Select
                value={levelId}
                onValueChange={(v) => v && setLevelId(v)}
                required
                items={toSelectItems(levels, 'id', 'label')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Genre</Label>
              <Select
                value={classGender}
                onValueChange={(v) => v && setClassGender(v)}
                items={[
                  { value: 'GARCON', label: 'Garçons' },
                  { value: 'FILLE', label: 'Filles' },
                  { value: 'MIXTE', label: 'Mixte' },
                ]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GARCON">Garçons</SelectItem>
                  <SelectItem value="FILLE">Filles</SelectItem>
                  <SelectItem value="MIXTE">Mixte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Professeur attitré</Label>
            <Select
              value={teacherId}
              onValueChange={(v) => setTeacherId(v ?? '')}
              items={[
                { value: '__none__', label: 'Aucun' },
                ...toSelectItems(teachers, 'id', 'name'),
              ]}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un professeur (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Aucun</SelectItem>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Créneau</Label>
              <Select
                value={timeSlot}
                onValueChange={(v) => v && setTimeSlot(v)}
                items={TIME_SLOTS.map((ts) => ({
                  value: ts,
                  label: TIME_SLOT_LABELS[ts],
                }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((ts) => (
                    <SelectItem key={ts} value={ts}>
                      {TIME_SLOT_LABELS[ts]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-room">Salle</Label>
              <Input
                id="class-room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="ex: Salle 1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class-start">Heure de début</Label>
              <Input
                id="class-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-end">Heure de fin</Label>
              <Input
                id="class-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Période</Label>
              <Select
                value={periodType}
                onValueChange={(v) => v && setPeriodType(v)}
                items={[
                  { value: 'TRIMESTRE', label: 'Trimestre' },
                  { value: 'SEMESTRE', label: 'Semestre' },
                  { value: 'BIMESTRE', label: 'Bimestre' },
                  { value: 'PERIODE', label: 'Période' },
                ]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRIMESTRE">Trimestre</SelectItem>
                  <SelectItem value="SEMESTRE">Semestre</SelectItem>
                  <SelectItem value="BIMESTRE">Bimestre</SelectItem>
                  <SelectItem value="PERIODE">Période</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-capacity">Nombre de places</Label>
              <Input
                id="class-capacity"
                type="number"
                min={1}
                max={100}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
