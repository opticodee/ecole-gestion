'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { SubjectForm } from './subject-form';
import { SubjectDeleteDialog } from './subject-delete-dialog';
import type { SubjectRow } from '@/server/actions/subjects';
import { cn } from '@/lib/utils';

interface Tree {
  parent: SubjectRow;
  children: SubjectRow[];
}

export function SubjectList({ subjects }: { subjects: SubjectRow[] }) {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<SubjectRow | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubjectRow | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const tree = useMemo<Tree[]>(() => {
    const byParent: Record<string, SubjectRow[]> = {};
    for (const s of subjects) {
      if (s.parentId) {
        (byParent[s.parentId] ??= []).push(s);
      }
    }
    return subjects
      .filter((s) => s.parentId === null)
      .map((parent) => ({
        parent,
        children: (byParent[parent.id] ?? []).sort((a, b) => a.label.localeCompare(b.label)),
      }))
      .sort((a, b) => a.parent.label.localeCompare(b.parent.label));
  }, [subjects]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tree;
    return tree
      .map((t) => {
        const parentMatches = t.parent.label.toLowerCase().includes(q);
        const matchingChildren = t.children.filter((c) =>
          c.label.toLowerCase().includes(q),
        );
        if (parentMatches || matchingChildren.length > 0) {
          return {
            parent: t.parent,
            // Si le parent correspond, on garde tous les enfants. Sinon, seulement les enfants qui matchent
            children: parentMatches ? t.children : matchingChildren,
          };
        }
        return null;
      })
      .filter((t): t is Tree => t !== null);
  }, [tree, search]);

  // En cas de recherche, on déplie tout
  const effectiveExpanded = search.trim() !== ''
    ? new Set(filtered.map((t) => t.parent.id))
    : expanded;

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreate() {
    setEditSubject(null);
    setDefaultParentId(null);
    setFormOpen(true);
  }

  function openCreateChild(parentId: string) {
    setEditSubject(null);
    setDefaultParentId(parentId);
    setFormOpen(true);
  }

  function openEdit(subject: SubjectRow) {
    setEditSubject(subject);
    setDefaultParentId(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditSubject(null);
    setDefaultParentId(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Matières" actionLabel="Ajouter une matière" onAction={openCreate} />

      <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une matière..." />

      {filtered.length === 0 ? (
        <EmptyState message="Aucune matière trouvée." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-background">
          <div className="divide-y">
            {filtered.map(({ parent, children }) => {
              const isOpen = effectiveExpanded.has(parent.id);
              const hasChildren = children.length > 0;
              return (
                <div key={parent.id}>
                  <div
                    className={cn(
                      'flex items-center gap-3 px-4 py-3',
                      hasChildren && 'cursor-pointer hover:bg-muted/40',
                    )}
                    onClick={() => hasChildren && toggle(parent.id)}
                  >
                    <div className="flex h-6 w-6 items-center justify-center text-muted-foreground">
                      {hasChildren ? (
                        isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                      ) : null}
                    </div>
                    {parent.color && (
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border"
                        style={{ backgroundColor: parent.color }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{parent.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {parent.weeklyHours}h/sem
                        {hasChildren && ` · ${children.length} sous-matière${children.length > 1 ? 's' : ''}`}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {parent.teachers.slice(0, 3).map((t) => (
                        <Badge key={t.id} variant="secondary" className="text-xs">
                          {t.name}
                        </Badge>
                      ))}
                      {parent.teachers.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{parent.teachers.length - 3}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openCreateChild(parent.id)}
                        title="Ajouter une sous-matière"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(parent)}
                        title="Modifier"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(parent)}
                        title="Supprimer"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {isOpen && hasChildren && (
                    <div className="bg-muted/20">
                      {children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center gap-3 px-4 py-2 pl-16 border-t"
                        >
                          <div className="flex-1">
                            <div className="text-sm">{child.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {child.weeklyHours}h/sem
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {child.teachers.slice(0, 2).map((t) => (
                              <Badge key={t.id} variant="outline" className="text-xs">
                                {t.name}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEdit(child)}
                              title="Modifier"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeleteTarget(child)}
                              title="Supprimer"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {formOpen && (
        <SubjectForm
          open={formOpen}
          onClose={closeForm}
          subject={editSubject}
          subjects={subjects}
          defaultParentId={defaultParentId}
        />
      )}

      {deleteTarget && (
        <SubjectDeleteDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          subject={deleteTarget}
        />
      )}
    </div>
  );
}
