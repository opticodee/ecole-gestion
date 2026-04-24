import { MapPin, Clock, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TIME_SLOT_LABELS } from '@/lib/time-slots';
import { AttendanceTriggerButton } from './attendance-trigger-button';
import { ClassGenderBadge } from './class-gender-badge';

interface SlotEntry {
  scheduleId: string;
  classGroupId: string;
  classLabel: string;
  levelLabel: string;
  classGender: string;
  teacherName: string | null;
  room: string | null;
  startTime: string;
  endTime: string;
  studentCount: number;
}

interface WeeklyPlanningProps {
  items: { timeSlot: string; entry: SlotEntry | null }[];
}

export function WeeklyPlanning({ items }: WeeklyPlanningProps) {
  return (
    <Card className="border border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Planning de la semaine
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="grid min-w-[900px] grid-cols-5 gap-3">
          {items.map(({ timeSlot, entry }) => (
            <div
              key={timeSlot}
              className="flex flex-col rounded-lg border border-border/60 bg-muted/30 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/50 hover:shadow-sm"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {TIME_SLOT_LABELS[timeSlot]}
              </p>
              {entry ? (
                <>
                  <div className="mb-2 flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{entry.classLabel}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {entry.levelLabel}
                      </p>
                    </div>
                    <ClassGenderBadge gender={entry.classGender} />
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="truncate">
                      {entry.teacherName || (
                        <span className="text-red-600 dark:text-red-400">Pas de prof</span>
                      )}
                    </p>
                    <p className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {entry.startTime}–{entry.endTime}
                    </p>
                    {entry.room && (
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {entry.room}
                      </p>
                    )}
                    <p className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {entry.studentCount} élève(s)
                    </p>
                  </div>
                  <div className="mt-3">
                    <AttendanceTriggerButton
                      classGroupId={entry.classGroupId}
                      size="xs"
                    />
                  </div>
                </>
              ) : (
                <p className="py-6 text-center text-xs italic text-muted-foreground">
                  Libre
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
