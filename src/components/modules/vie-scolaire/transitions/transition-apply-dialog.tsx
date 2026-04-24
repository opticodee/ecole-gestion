'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
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
import { applyTransitions, type TransitionData } from '@/server/actions/transitions';

interface Props {
  open: boolean;
  onClose: () => void;
  classGroupId: string;
  data: TransitionData;
  onApplied: () => void;
}

export function TransitionApplyDialog({
  open,
  onClose,
  classGroupId,
  data,
  onApplied,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleApply() {
    setLoading(true);
    const result = await applyTransitions(classGroupId);
    setLoading(false);
    if ('error' in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Passages appliqués avec succès.');
    onClose();
    onApplied();
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Appliquer les passages
          </AlertDialogTitle>
          <AlertDialogDescription>
            Cette action va déplacer{' '}
            <strong>{data.decisionCounts.PASSAGE} élève(s)</strong> vers leurs nouvelles
            classes. Les élèves marqués « Départ » (
            <strong>{data.decisionCounts.DEPART}</strong>) seront passés en statut RADIÉ.{' '}
            <strong className="text-orange-700">Cette action est irréversible.</strong>
          </AlertDialogDescription>
          <div className="space-y-1 rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
            <div>Passages : {data.decisionCounts.PASSAGE}</div>
            <div>Redoublements : {data.decisionCounts.REDOUBLEMENT}</div>
            <div>Départs : {data.decisionCounts.DEPART}</div>
            <div className="pt-1 italic">
              Les capacités et la compatibilité de genre seront vérifiées avant l&apos;application.
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleApply} disabled={loading}>
            {loading ? 'Application...' : 'Confirmer et appliquer'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
