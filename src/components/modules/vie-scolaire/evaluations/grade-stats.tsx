'use client';

interface GradeStatsProps {
  scores: number[];
  absents: number;
  totalStudents: number;
  scale: number;
}

function formatNum(n: number, digits = 2): string {
  return Number.isFinite(n) ? n.toFixed(digits) : '—';
}

export function GradeStats({ scores, absents, totalStudents, scale }: GradeStatsProps) {
  const count = scores.length;
  const avg = count > 0 ? scores.reduce((a, b) => a + b, 0) / count : 0;
  const max = count > 0 ? Math.max(...scores) : 0;
  const min = count > 0 ? Math.min(...scores) : 0;
  const noted = count;
  const pending = Math.max(0, totalStudents - noted - absents);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <Stat label="Moyenne" value={count > 0 ? `${formatNum(avg)} / ${scale}` : '—'} />
      <Stat label="Max" value={count > 0 ? `${formatNum(max, 1)}` : '—'} />
      <Stat label="Min" value={count > 0 ? `${formatNum(min, 1)}` : '—'} />
      <Stat label="Noté(e)s" value={`${noted} / ${totalStudents}`} />
      <Stat label="Absent(e)s" value={`${absents}${pending > 0 ? ` · ${pending} restant` : ''}`} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold">{value}</p>
    </div>
  );
}
