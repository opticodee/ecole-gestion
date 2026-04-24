'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { LevelForm } from './level-form';
import { LevelDeleteDialog } from './level-delete-dialog';
import type { LevelRow } from '@/server/actions/levels';
import { cn } from '@/lib/utils';

function FillBar({ rate }: { rate: number }) {
  const color =
    rate > 95 ? 'bg-red-500' : rate >= 80 ? 'bg-orange-400' : 'bg-primary';

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-muted">
        <div
          className={cn('h-2 rounded-full transition-all', color)}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{rate}%</span>
    </div>
  );
}

export function LevelList({ levels }: { levels: LevelRow[] }) {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editLevel, setEditLevel] = useState<LevelRow | null>(null);
  const [deleteLevel, setDeleteLevel] = useState<LevelRow | null>(null);

  const filtered = levels.filter((l) =>
    l.label.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setEditLevel(null);
    setFormOpen(true);
  }

  function openEdit(level: LevelRow) {
    setEditLevel(level);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditLevel(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Niveaux" actionLabel="Ajouter un niveau" onAction={openCreate} />

      <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un niveau..." />

      {filtered.length === 0 ? (
        <EmptyState message="Aucun niveau trouvé." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead>Libellé</TableHead>
                <TableHead className="text-right">Nombre de places</TableHead>
                <TableHead className="text-right">Élèves inscrits</TableHead>
                <TableHead>Taux de remplissage</TableHead>
                <TableHead className="text-right">Classes</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((level) => (
                <TableRow key={level.id}>
                  <TableCell className="font-medium">{level.label}</TableCell>
                  <TableCell className="text-right">{level.totalCapacity}</TableCell>
                  <TableCell className="text-right">{level.totalStudents}</TableCell>
                  <TableCell>
                    <FillBar rate={level.fillRate} />
                  </TableCell>
                  <TableCell className="text-right">{level.classCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(level)}
                        title="Modifier"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteLevel(level)}
                        title="Supprimer"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {formOpen && (
        <LevelForm open={formOpen} onClose={closeForm} level={editLevel} />
      )}

      {deleteLevel && (
        <LevelDeleteDialog
          open={!!deleteLevel}
          onClose={() => setDeleteLevel(null)}
          level={deleteLevel}
        />
      )}
    </div>
  );
}
