'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck } from 'lucide-react';
import { AttendanceSelector } from './attendance-selector';
import { AttendanceWeeklyStatus } from './attendance-weekly-status';
import { AttendanceHistory } from './attendance-history';
import { AttendanceStats } from './attendance-stats';
import { AttendanceModal } from './attendance-modal';
import { AttendanceDetailModal } from './attendance-detail-modal';
import type {
  AttendanceClassOption,
  AttendanceHistoryRow,
  AttendanceStats as AttendanceStatsType,
  WeeklyAttendanceStatusRow,
} from '@/server/actions/attendance';

interface AttendancePageProps {
  classes: AttendanceClassOption[];
  initialHistory: AttendanceHistoryRow[];
  weeklyStatus: WeeklyAttendanceStatusRow[];
  initialStats: AttendanceStatsType;
}

export function AttendancePage({
  classes,
  initialHistory,
  weeklyStatus,
  initialStats,
}: AttendancePageProps) {
  const router = useRouter();
  const [modal, setModal] = useState<{
    classGroupId: string;
    dateISO: string;
  } | null>(null);
  const [detail, setDetail] = useState<{
    classGroupId: string;
    dateISO: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openAppel(classGroupId: string, dateISO: string) {
    setModal({ classGroupId, dateISO });
  }

  function closeAppel() {
    setModal(null);
    setRefreshKey((k) => k + 1);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-7 w-7 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appel</h1>
          <p className="text-sm text-muted-foreground">
            Gérer les appels de présence, consulter l&apos;historique et les statistiques.
          </p>
        </div>
      </div>

      <AttendanceSelector classes={classes} onOpenModal={openAppel} />

      <AttendanceWeeklyStatus rows={weeklyStatus} onLaunch={openAppel} />

      <AttendanceHistory
        classes={classes}
        initialRows={initialHistory}
        onViewDetail={(classGroupId, dateISO) =>
          setDetail({ classGroupId, dateISO })
        }
        onEdit={openAppel}
        refreshKey={refreshKey}
      />

      <AttendanceStats stats={initialStats} />

      {modal && (
        <AttendanceModal
          open
          onClose={closeAppel}
          classGroupId={modal.classGroupId}
          dateISO={modal.dateISO}
        />
      )}

      {detail && (
        <AttendanceDetailModal
          open
          onClose={() => setDetail(null)}
          classGroupId={detail.classGroupId}
          dateISO={detail.dateISO}
        />
      )}
    </div>
  );
}
