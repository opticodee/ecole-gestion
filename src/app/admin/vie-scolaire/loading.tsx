export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-60 rounded bg-muted" />
        <div className="h-4 w-80 rounded bg-muted" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border bg-muted/40" />
        ))}
      </div>

      <div className="h-60 rounded-lg border bg-muted/40" />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="h-64 rounded-lg border bg-muted/40 lg:col-span-3" />
        <div className="h-64 rounded-lg border bg-muted/40 lg:col-span-2" />
      </div>

      <div className="h-48 rounded-lg border bg-muted/40" />
    </div>
  );
}
