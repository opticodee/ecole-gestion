'use client';

import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AttendanceModal } from '@/components/modules/vie-scolaire/attendance/attendance-modal';

interface AttendanceTriggerButtonProps {
  classGroupId: string;
  dateISO?: string;
  size?: 'xs' | 'sm' | 'default';
  variant?: 'default' | 'outline';
  label?: string;
}

export function AttendanceTriggerButton({
  classGroupId,
  dateISO,
  size = 'sm',
  variant = 'default',
  label = "Faire l'appel",
}: AttendanceTriggerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size={size}
        variant={variant}
        onClick={() => setOpen(true)}
        className={
          variant === 'default' ? 'bg-green-600 hover:bg-green-700' : undefined
        }
      >
        <ClipboardCheck className="h-3.5 w-3.5" />
        {label}
      </Button>
      {open && (
        <AttendanceModal
          open={open}
          onClose={() => setOpen(false)}
          classGroupId={classGroupId}
          dateISO={dateISO}
        />
      )}
    </>
  );
}
