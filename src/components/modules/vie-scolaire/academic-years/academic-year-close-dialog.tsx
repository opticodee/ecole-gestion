'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  closeAcademicYear,
  getClosureWarnings,
  type AcademicYearRow,
} from '@/server/actions/academic-years';

interface Props {
  open: boolean;
  onClose: () => void;
  year: AcademicYearRow;
  onClosed: () => void;
}

export function AcademicYearCloseDialog({
  open,
  onClose,
  year,
  onClosed,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<{
    pendingPassages: number;
    unappliedTransitions: number;
    studentsInYear: number;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const result = await getClosureWarnings(year.id);
      if ('error' in result) return;
      setWarnings({
        pendingPassages: result.pendingPassages,
        unappliedTransitions: result.unappliedTransitions,
        studentsInYear: result.studentsInYear,
      });
    })();
  }, [open, year.id]);

  async function handleClose() {
    setLoading(true);
    const result = await closeAcademicYear(year.id);
    setLoading(false);
    if ('error' in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Année ${year.label} clôturée.`);
    onClose();
    onClosed();
  }

  const hasPassageWarning =
    warnings !== null &&
    (warnings.pendingPassages > 0 || warnings.unappliedTransitions > 0);

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-orange-700">
            <Lock className="h-5 w-5" />
            Clôturer l&apos;année {year.label}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Toutes les données (notes, appels, bulletins, appréciations) de
            l&apos;année <strong>{year.label}</strong> seront archivées en
            lecture seule.{' '}
            <strong className="text-red-700">Cette action est irréversible.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasPassageWarning && (
          <div className="space-y-2 rounded-md border border-orange-200 bg-orange-50 p-3 text-xs text-orange-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold">
                  Attention : les passages de classe n&apos;ont pas tous été
                  appliqués.
                </p>
                <ul className="ml-4 list-disc space-y-0.5">
                  {warnings!.pendingPassages > 0 && (
                    <li>
                      {warnings!.pendingPassages} élève(s) sans décision de
                      passage
                    </li>
                  )}
                  {warnings!.unappliedTransitions > 0 && (
                    <li>
                      {warnings!.unappliedTransitions} décision(s) enregistrée(s)
                      mais non appliquée(s)
                    </li>
                  )}
                </ul>
                <Link
                  href="/admin/vie-scolaire/passage"
                  className="inline-block underline"
                  onClick={onClose}
                >
                  → Ouvrir la page Passage de classe
                </Link>
              </div>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleClose}
            disabled={loading}
            className="bg-orange-600 text-white hover:bg-orange-700"
          >
            {loading ? 'Clôture...' : 'Confirmer la clôture'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
