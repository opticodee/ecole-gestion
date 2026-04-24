'use client';

import { useState, useTransition } from 'react';
import { Loader2, MessageSquareText, Save, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toSelectItems,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { APPRECIATION_SUGGESTIONS, formatAverage, SAISIE_PERIODS } from '@/lib/bulletin';
import {
  getAppreciationsData,
  saveAppreciations,
  type AppreciationsData,
} from '@/server/actions/appreciations';
import type { GradesSummaryOptions } from '@/server/actions/grades-summary';

interface Props {
  options: GradesSummaryOptions;
}

type StudentState = AppreciationsData['students'][number];

export function AppreciationsView({ options }: Props) {
  const [classId, setClassId] = useState<string>(options.classes[0]?.id ?? '');
  const [period, setPeriod] = useState<number>(1);
  const [data, setData] = useState<AppreciationsData | null>(null);
  const [entries, setEntries] = useState<StudentState[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  function handleLoad() {
    if (!classId) {
      toast.error('Veuillez sélectionner une classe.');
      return;
    }
    startTransition(async () => {
      const result = await getAppreciationsData(classId, period);
      if (result.error) {
        toast.error(result.error);
        setData(null);
        setEntries([]);
        return;
      }
      setData(result.data ?? null);
      setEntries(result.data ? result.data.students.map((s) => ({ ...s })) : []);
    });
  }

  function updateGeneral(studentId: string, value: string) {
    setEntries((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, generalComment: value } : s)),
    );
  }

  function updateSubjectComment(studentId: string, subjectId: string, value: string) {
    setEntries((prev) =>
      prev.map((s) =>
        s.studentId === studentId
          ? { ...s, subjectComments: { ...s.subjectComments, [subjectId]: value } }
          : s,
      ),
    );
  }

  async function handleSave() {
    if (!data) return;
    setIsSaving(true);
    const result = await saveAppreciations({
      classGroupId: classId,
      period,
      entries: entries.map((e) => ({
        studentId: e.studentId,
        generalComment: e.generalComment || null,
        subjectComments: e.subjectComments,
      })),
    });
    setIsSaving(false);
    if ('error' in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Appréciations enregistrées.');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquareText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Appréciations</h1>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Classe</label>
          <Select
            value={classId}
            onValueChange={(v) => setClassId(v ?? '')}
            items={toSelectItems(options.classes, 'id', 'label')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner une classe" />
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
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Période</label>
          <Select
            value={String(period)}
            onValueChange={(v) => setPeriod(Number(v ?? '1'))}
            items={SAISIE_PERIODS.map((p) => ({
              value: String(p.periodNumber),
              label: p.label,
            }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SAISIE_PERIODS.map((p) => (
                <SelectItem key={p.key} value={String(p.periodNumber)}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleLoad} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Charger
        </Button>
      </div>

      {data && (
        <>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
              <span className="font-semibold">{data.classLabel}</span>
              <span className="text-muted-foreground">Niveau : {data.levelLabel}</span>
              <span className="text-muted-foreground">Année : {data.academicYearLabel}</span>
              <span className="text-muted-foreground">Trimestre : {data.period}</span>
              <span className="ml-auto text-xs text-muted-foreground">{entries.length} élève(s)</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead className="w-48">Élève</TableHead>
                  <TableHead className="w-20 text-center">Moy.</TableHead>
                  <TableHead className="min-w-[18rem]">Appréciation générale</TableHead>
                  {data.subjects.map((s) => (
                    <TableHead key={s.id} className="min-w-[14rem]">
                      {s.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.studentId}>
                    <TableCell className="align-top font-medium">
                      {e.lastName.toUpperCase()} {e.firstName}
                      <div className="text-[10px] text-muted-foreground">{e.matricule}</div>
                    </TableCell>
                    <TableCell className="align-top text-center text-sm font-semibold">
                      {formatAverage(e.overallAverage)}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-start gap-1">
                        <textarea
                          className="flex-1 min-h-[68px] w-full rounded-md border border-input bg-background p-2 text-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                          rows={3}
                          value={e.generalComment ?? ''}
                          onChange={(ev) => updateGeneral(e.studentId, ev.target.value)}
                          placeholder="Commentaire général..."
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" title="Suggestions">
                                <Wand2 className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            {APPRECIATION_SUGGESTIONS.map((sugg) => (
                              <DropdownMenuItem
                                key={sugg}
                                onClick={() => updateGeneral(e.studentId, sugg)}
                              >
                                {sugg}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                    {data.subjects.map((subj) => (
                      <TableCell key={subj.id} className="align-top">
                        <textarea
                          className="w-full min-h-[56px] rounded-md border border-input bg-background p-2 text-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                          rows={2}
                          value={e.subjectComments[subj.id] ?? ''}
                          onChange={(ev) =>
                            updateSubjectComment(e.studentId, subj.id, ev.target.value)
                          }
                          placeholder={`Appréciation ${subj.label.toLowerCase()}...`}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Enregistrement...' : 'Enregistrer les appréciations'}
            </Button>
          </div>
        </>
      )}

      {!data && !isPending && (
        <div className="rounded-lg border border-dashed bg-muted/20 py-16 text-center text-sm text-muted-foreground">
          Sélectionnez une classe et un trimestre, puis cliquez sur « Charger ».
        </div>
      )}
    </div>
  );
}
