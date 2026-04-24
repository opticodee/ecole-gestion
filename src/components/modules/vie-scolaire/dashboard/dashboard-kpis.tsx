import { GraduationCap, School, Users, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardKPIsProps {
  studentsTotal: number;
  boys: number;
  girls: number;
  classesTotal: number;
  classesGarcon: number;
  classesFille: number;
  classesMixte: number;
  teachers: number;
  subjects: number;
  monthAbsences: number;
  monthRetards: number;
}

type Color = 'green' | 'blue' | 'violet' | 'orange';

const COLOR_MAP: Record<
  Color,
  { bg: string; text: string; bar: string; trendUp: string; trendDown: string }
> = {
  green: {
    bg: 'bg-emerald-100 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    bar: 'bg-emerald-500/80',
    trendUp: 'text-emerald-600 dark:text-emerald-400',
    trendDown: 'text-red-600 dark:text-red-400',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    bar: 'bg-blue-500/80',
    trendUp: 'text-emerald-600 dark:text-emerald-400',
    trendDown: 'text-red-600 dark:text-red-400',
  },
  violet: {
    bg: 'bg-violet-100 dark:bg-violet-500/15',
    text: 'text-violet-600 dark:text-violet-400',
    bar: 'bg-violet-500/80',
    trendUp: 'text-emerald-600 dark:text-emerald-400',
    trendDown: 'text-red-600 dark:text-red-400',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-500/15',
    text: 'text-orange-600 dark:text-orange-400',
    bar: 'bg-orange-500/80',
    trendUp: 'text-red-600 dark:text-red-400',
    trendDown: 'text-emerald-600 dark:text-emerald-400',
  },
};

function Sparkline({ bars, color }: { bars: number[]; color: string }) {
  const max = Math.max(...bars, 1);
  return (
    <div className="flex h-8 items-end gap-0.5">
      {bars.map((v, i) => (
        <span
          key={i}
          className={cn('w-1 rounded-sm opacity-70 transition-all', color)}
          style={{ height: `${Math.max((v / max) * 100, 10)}%` }}
        />
      ))}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  subtext,
  color,
  highlight,
  bars,
  trend,
  trendDirection,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: number;
  subtext: string;
  color: Color;
  highlight?: boolean;
  bars: number[];
  trend: string;
  trendDirection: 'up' | 'down' | 'flat';
}) {
  const c = COLOR_MAP[color];
  const TrendIcon = trendDirection === 'down' ? TrendingDown : TrendingUp;
  const trendClass =
    trendDirection === 'flat'
      ? 'text-muted-foreground'
      : trendDirection === 'up'
        ? c.trendUp
        : c.trendDown;

  return (
    <Card
      className={cn(
        'group/kpi border border-border/60 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md',
        highlight && 'border-orange-300/50 bg-orange-50/40 dark:bg-orange-500/5',
      )}
    >
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                c.bg,
              )}
            >
              <Icon className={cn('h-4 w-4', c.text)} />
            </div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
          </div>
          <p className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {trendDirection !== 'flat' && (
              <span className={cn('inline-flex items-center gap-0.5 font-medium', trendClass)}>
                <TrendIcon className="h-3 w-3" />
                {trend}
              </span>
            )}
            {subtext && <span className="truncate">{subtext}</span>}
          </div>
        </div>
        <Sparkline bars={bars} color={c.bar} />
      </CardContent>
    </Card>
  );
}

export function DashboardKPIs(props: DashboardKPIsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi
        icon={GraduationCap}
        label="Élèves actifs"
        value={props.studentsTotal}
        subtext={`${props.boys} G · ${props.girls} F`}
        color="green"
        bars={[4, 6, 5, 8, 7, 9, 10]}
        trend="+4%"
        trendDirection="up"
      />
      <Kpi
        icon={School}
        label="Classes"
        value={props.classesTotal}
        subtext={`${props.classesMixte} mixtes`}
        color="blue"
        bars={[3, 5, 5, 6, 6, 7, 7]}
        trend="stable"
        trendDirection="flat"
      />
      <Kpi
        icon={Users}
        label="Enseignants"
        value={props.teachers}
        subtext={`${props.subjects} matières`}
        color="violet"
        bars={[2, 3, 4, 4, 5, 5, 6]}
        trend="+2"
        trendDirection="up"
      />
      <Kpi
        icon={AlertTriangle}
        label="Absences ce mois"
        value={props.monthAbsences}
        subtext={`${props.monthRetards} retards`}
        color="orange"
        highlight={props.monthAbsences > 20}
        bars={[6, 4, 7, 5, 8, 6, 9]}
        trend="+12%"
        trendDirection="up"
      />
    </div>
  );
}
