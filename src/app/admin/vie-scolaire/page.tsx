import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth-utils';
import { getDashboardData } from '@/server/actions/dashboard';
import { DashboardKPIs } from '@/components/modules/vie-scolaire/dashboard/dashboard-kpis';
import { WeeklyPlanning } from '@/components/modules/vie-scolaire/dashboard/weekly-planning';
import { UpcomingCourses } from '@/components/modules/vie-scolaire/dashboard/upcoming-courses';
import { AbsenceAlerts } from '@/components/modules/vie-scolaire/dashboard/absence-alerts';
import { RecentActivity } from '@/components/modules/vie-scolaire/dashboard/recent-activity';

export const metadata: Metadata = {
  title: 'Tableau de bord',
};

export default async function AdminDashboardPage() {
  const session = await requireAuth();
  const data = await getDashboardData(session.user.schoolId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Tableau de bord
        </h1>
        <p className="text-sm text-muted-foreground">
          Bonjour {session.user.firstName}, voici la vue d&apos;ensemble de
          l&apos;école.
        </p>
      </div>

      <DashboardKPIs {...data.kpis} />

      <WeeklyPlanning items={data.weeklyPlanning} />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <UpcomingCourses
            date={data.upcoming.date}
            isToday={data.upcoming.isToday}
            items={data.upcoming.items}
          />
        </div>
        <div className="lg:col-span-2">
          <AbsenceAlerts alerts={data.alerts} />
        </div>
      </div>

      <RecentActivity items={data.recent} />
    </div>
  );
}
