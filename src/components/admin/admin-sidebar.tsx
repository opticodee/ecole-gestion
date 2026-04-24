'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpCircle,
  Calendar,
  CalendarDays,
  LayoutDashboard,
  GraduationCap,
  UserCheck,
  Users,
  BookOpen,
  ClipboardList,
  ClipboardCheck,
  FileCheck,
  BarChart3,
  MessageSquareText,
  Award,
  FileText,
  Layers,
  School,
  BookMarked,
  X,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Calendar;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Tableau de bord',
    items: [
      { href: '/admin/vie-scolaire', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Organisation',
    items: [
      { href: '/admin/vie-scolaire/annee-scolaire', label: 'Année scolaire', icon: CalendarDays },
      { href: '/admin/vie-scolaire/emploi-du-temps', label: 'Emploi du temps', icon: Calendar },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { href: '/admin/vie-scolaire/eleves', label: 'Élèves', icon: GraduationCap },
      { href: '/admin/vie-scolaire/enseignants', label: 'Enseignants', icon: UserCheck },
      { href: '/admin/vie-scolaire/parents', label: 'Parents / Familles', icon: Users },
    ],
  },
  {
    title: 'Pédagogie',
    items: [
      { href: '/admin/vie-scolaire/contenu-cours', label: 'Contenu de cours', icon: BookOpen },
      { href: '/admin/vie-scolaire/devoirs', label: 'Devoirs', icon: ClipboardList },
      { href: '/admin/vie-scolaire/appel', label: 'Appel', icon: ClipboardCheck },
      { href: '/admin/vie-scolaire/evaluations', label: 'Évaluations', icon: FileCheck },
    ],
  },
  {
    title: 'Résultats',
    items: [
      { href: '/admin/vie-scolaire/notes', label: 'Notes & Moyennes', icon: BarChart3 },
      { href: '/admin/vie-scolaire/appreciations', label: 'Appréciations', icon: MessageSquareText },
      { href: '/admin/vie-scolaire/mentions', label: 'Mentions', icon: Award },
      { href: '/admin/vie-scolaire/bulletins', label: 'Bulletins', icon: FileText },
    ],
  },
  {
    title: "Fin d'année",
    items: [
      { href: '/admin/vie-scolaire/conseil-classe', label: 'Conseil de classe', icon: Users },
      { href: '/admin/vie-scolaire/livret', label: 'Livret scolaire', icon: BookOpen },
      { href: '/admin/vie-scolaire/passage', label: 'Passage de classe', icon: ArrowUpCircle },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { href: '/admin/vie-scolaire/niveaux', label: 'Niveaux', icon: Layers },
      { href: '/admin/vie-scolaire/classes', label: 'Classes', icon: School },
      { href: '/admin/vie-scolaire/matieres', label: 'Matières', icon: BookMarked },
    ],
  },
];

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="shrink-0 border-b border-sidebar-border px-6 py-5">
        <h2 className="text-base font-semibold tracking-tight text-white">ACMSCHOOL</h2>
        <p className="mt-0.5 text-xs text-sidebar-foreground/60">Vie Scolaire</p>
      </div>

      <div className="relative flex-1 overflow-y-auto">
        <nav className="space-y-6 px-3 py-5 pb-20">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
                {group.title}
              </p>
              {group.items.map((item) => {
                const isActive =
                  item.href === '/admin/vie-scolaire'
                    ? pathname === '/admin/vie-scolaire'
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onItemClick}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-sidebar-accent/70 text-white'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-white',
                    )}
                  >
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                      />
                    )}
                    <item.icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive
                          ? 'text-primary'
                          : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80',
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sticky bottom-0 border-t border-sidebar-border bg-sidebar p-3 shadow-[0_-8px_16px_-8px_rgba(0,0,0,0.25)]">
          <Link
            href="/admin/modules"
            onClick={onItemClick}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Retour aux modules
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
          <div className="flex items-center justify-end p-2">
            <button onClick={onClose} className="rounded-md p-1 text-sidebar-foreground/60 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <SidebarContent onItemClick={onClose} />
        </SheetContent>
      </Sheet>
    </>
  );
}
