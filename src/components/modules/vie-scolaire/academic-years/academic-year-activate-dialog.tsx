'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
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
  activateAcademicYear,
  type AcademicYearRow,
} from '@/server/actions/academic-years';

interface Props {
  open: boolean;
  onClose: () => void;
  year: AcademicYearRow;
  activeYear: AcademicYearRow | null;
  onActivated: () => void;
}

export function AcademicYearActivateDialog({
  open,
  onClose,
  year,
  activeYear,
  onActivated,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleActivate(closePrevious: boolean) {
    setLoading(true);
    const result = await activateAcademicYear(year.id, closePrevious);
    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(result.error);
      return;
    }
    if ('conflict' in result && result.conflict) {
      // Shouldn't happen if caller passes closePrevious=true when needed
      toast.error(`L'année ${result.conflict.activeLabel} est déjà active.`);
      return;
    }

    toast.success(`Année ${year.label} activée.`);
    onClose();
    onActivated();
  }

  const hasConflict = !!activeYear && activeYear.id !== year.id;

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Activer l&apos;année {year.label}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasConflict ? (
              <>
                L&apos;année <strong>{activeYear.label}</strong> est actuellement
                active. Voulez-vous la clôturer et activer{' '}
                <strong>{year.label}</strong> ?
              </>
            ) : (
              <>
                Cette action rendra <strong>{year.label}</strong> l&apos;année en
                cours. Toutes les nouvelles données (notes, appels, bulletins)
                seront liées à cette année.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasConflict && (
          <div className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 p-2 text-xs text-orange-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              La clôture de {activeYear.label} est irréversible. Pensez à avoir
              appliqué les passages de classe avant.
            </span>
          </div>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={() => handleActivate(hasConflict)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading
              ? 'Activation...'
              : hasConflict
                ? `Clôturer ${activeYear.label} et activer ${year.label}`
                : `Activer ${year.label}`}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
