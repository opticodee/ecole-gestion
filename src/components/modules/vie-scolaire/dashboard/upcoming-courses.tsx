import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TIME_SLOT_LABELS } from '@/lib/time-slots';
import { formatDateFR } from '@/lib/formatters';
import { AttendanceTriggerButton } from './attendance-trigger-button';
import { ClassGenderBadge } from './class-gender-badge';

interface UpcomingEntry {
  scheduleId: string;
  classGroupId: string;
  classLabel: string;
  levelLabel: string;
  classGender: string;
  teacherName: string | null;
  startTime: string;
  endTime: string;
  studentCount: number;
}

interface UpcomingCoursesProps {
  date: string;
  isToday: boolean;
  items: { timeSlot: string; entry: UpcomingEntry }[];
}

export function UpcomingCourses({ date, isToday, items }: UpcomingCoursesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Prochains cours
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {formatDateFR(date)}
          </span>
          {isToday && (
            <span className="ml-2 inline-flex items-center rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
              Aujourd&apos;hui
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Aucun cours programmé.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map(({ timeSlot, entry }) => (
              <div
                key={entry.scheduleId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/20 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="font-semibold">{entry.classLabel}</p>
                    <ClassGenderBadge gender={entry.classGender} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.teacherName || '—'} · {TIME_SLOT_LABELS[timeSlot]}{' '}
                    ({entry.startTime}–{entry.endTime}) · {entry.studentCount}{' '}
                    élève(s)
                  </p>
                </div>
                <AttendanceTriggerButton
                  classGroupId={entry.classGroupId}
                  size="sm"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
