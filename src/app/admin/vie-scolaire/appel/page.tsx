import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Appel' };

import { requireAuth } from '@/lib/auth-utils';
import {
  getAttendanceHistory,
  getWeeklyAttendanceStatus,
  getAttendanceStats,
  getClassesForAttendance,
} from '@/server/actions/attendance';
import { AttendancePage } from '@/components/modules/vie-scolaire/attendance/attendance-page';

export default async function AppelPage() {
  await requireAuth();

  const [classes, history, weeklyStatus, stats] = await Promise.all([
    getClassesForAttendance(),
    getAttendanceHistory(),
    getWeeklyAttendanceStatus(),
    getAttendanceStats(),
  ]);

  return (
    <AttendancePage
      classes={classes}
      initialHistory={history}
      weeklyStatus={weeklyStatus}
      initialStats={stats}
    />
  );
}
