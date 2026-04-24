'use client';

import { useEffect, useMemo, useState } from 'react';
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
import {
  createEvaluation,
  updateEvaluation,
  type EvaluationOptions,
  type EvaluationRow,
} from '@/server/actions/evaluations';

const NONE = '__none__';

interface EvaluationFormProps {
  open: boolean;
  onClose: () => void;
  item?: EvaluationRow | null;
  options: EvaluationOptions;
}

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function EvaluationForm({ open, onClose, item, options }: EvaluationFormProps) {
  const isEdit = !!item;

  const [label, setLabel] = useState(item?.label ?? '');
  const [mode] = useState<'GROUP' | 'INDIVIDUAL'>('GROUP'); // UI ne propose pour l'instant que GROUP
  const [classGroupId, setClassGroupId] = useState(item?.classGroupId ?? '');
  const [teacherId, setTeacherId] = useState(item?.teacherId ?? '');
  const [subjectId, setSubjectId] = useState(item?.subjectId ?? '');
  const [subSubjectId, setSubSubjectId] = useState(item?.subSubjectId ?? '');
  const [evaluationType, setEvaluationType] = useState<'CONTROLE' | 'EXAMEN'>(
    item?.evaluationType ?? 'CONTROLE',
  );
  const [date, setDate] = useState(item ? item.date.slice(0, 10) : todayISO());
  const [coefficient, setCoefficient] = useState<string>(
    (item?.coefficient ?? 2).toString(),
  );
  const [scale, setScale] = useState<string>((item?.scale ?? 10).toString());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Matières de premier niveau (pour choix principal)
  const topLevelSubjects = useMemo(
    () => options.subjects.filter((s) => s.parentId === null),
    [options.subjects],
  );

  // Sous-matières filtrées selon le sujet principal sélectionné
  const childSubjects = useMemo(
    () => options.subjects.filter((s) => s.parentId === subjectId),
    [options.subjects, subjectId],
  );

  // Auto-assign teacher to class's mainTeacher when class changes (en création uniquement)
  useEffect(() => {
    if (!classGroupId) return;
    const cls = options.classes.find((c) => c.id === classGroupId);
    if (!cls) return;
    if (!isEdit && cls.mainTeacherId && !teacherId) {
      setTeacherId(cls.mainTeacherId);
    }
  }, [classGroupId, options.classes, isEdit, teacherId]);

  // Coefficient dynamique selon le type d'évaluation
  useEffect(() => {
    if (isEdit) return; // ne pas écraser en édition
    setCoefficient(evaluationType === 'CONTROLE' ? '2' : '1');
  }, [evaluationType, isEdit]);

  // Reset subSubject si on change de subject parent
  useEffect(() => {
    if (!subjectId) {
      setSubSubjectId('');
      return;
    }
    if (subSubjectId) {
      const still = options.subjects.find((s) => s.id === subSubjectId);
      if (!still || still.parentId !== subjectId) {
        setSubSubjectId('');
      }
    }
  }, [subjectId, subSubjectId, options.subjects]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = {
      label: label.trim(),
      mode,
      classGroupId,
      teacherId,
      subjectId,
      subSubjectId: subSubjectId || undefined,
      evaluationType,
      date,
      coefficient: Number(coefficient),
      scale: Number(scale),
    };

    const result = isEdit
      ? await updateEvaluation(item!.id, data)
      : await createEvaluation(data);

    setLoading(false);

    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }

    toast.success(isEdit ? 'Évaluation modifiée.' : 'Évaluation créée.');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'évaluation" : 'Nouvelle évaluation'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eval-label">Libellé</Label>
            <Input
              id="eval-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: Contrôle trimestriel de grammaire"
              required
              minLength={3}
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Classe</Label>
              <Select
                value={classGroupId}
                onValueChange={(v) => setClassGroupId(v ?? '')}
                items={toSelectItems(options.classes, 'id', 'label')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir une classe..." />
                </SelectTrigger>
                <SelectContent>
                  {options.classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Enseignant</Label>
              <Select
                value={teacherId}
                onValueChange={(v) => setTeacherId(v ?? '')}
                items={toSelectItems(options.teachers, 'id', 'name')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un enseignant..." />
                </SelectTrigger>
                <SelectContent>
                  {options.teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Matière</Label>
              <Select
                value={subjectId}
                onValueChange={(v) => setSubjectId(v ?? '')}
                items={toSelectItems(topLevelSubjects, 'id', 'label')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir une matière..." />
                </SelectTrigger>
                <SelectContent>
                  {topLevelSubjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sous-matière (optionnel)</Label>
              <Select
                value={subSubjectId || NONE}
                onValueChange={(v) => setSubSubjectId(!v || v === NONE ? '' : v)}
                disabled={!subjectId || childSubjects.length === 0}
                items={[
                  { value: NONE, label: 'Aucune' },
                  ...toSelectItems(childSubjects, 'id', 'label'),
                ]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Aucune" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Aucune</SelectItem>
                  {childSubjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={evaluationType}
                onValueChange={(v) => setEvaluationType((v as 'CONTROLE' | 'EXAMEN') ?? 'CONTROLE')}
                items={[
                  { value: 'CONTROLE', label: 'Contrôle' },
                  { value: 'EXAMEN', label: 'Examen' },
                ]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTROLE">Contrôle</SelectItem>
                  <SelectItem value="EXAMEN">Examen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eval-coef">Coefficient</Label>
              <Input
                id="eval-coef"
                type="number"
                step={0.5}
                min={0.1}
                max={10}
                value={coefficient}
                onChange={(e) => setCoefficient(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eval-scale">Barème</Label>
              <Input
                id="eval-scale"
                type="number"
                step={1}
                min={1}
                max={100}
                value={scale}
                onChange={(e) => setScale(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eval-date">Date</Label>
            <Input
              id="eval-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
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
