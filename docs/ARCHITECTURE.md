# Architecture Technique — EcoleGestion

## Résumé

Architecture Next.js 15 App Router, monorepo, avec séparation claire entre modules fonctionnels. Base PostgreSQL multi-tenant via Prisma. Authentification par rôles avec Auth.js v5.

## Stack détaillée

| Couche | Technologie | Justification |
|---|---|---|
| Frontend + Backend | Next.js 15 (App Router) | SSR, RSC, API routes intégrées, SEO |
| Langage | TypeScript strict | Sécurité du typage, maintenabilité |
| Base de données | PostgreSQL (Neon) | Robuste, relationnelle, JSON support |
| ORM | Prisma | Type-safe, migrations, introspection |
| Auth | Auth.js v5 (NextAuth) | Sessions, JWT, providers multiples |
| UI Components | shadcn/ui | Composants accessibles, personnalisables |
| Styling | Tailwind CSS | Utility-first, performant |
| Exports | xlsx, jsPDF, papaparse | Excel, PDF, CSV côté client |
| Hébergement | Vercel | Edge functions, preview deploys |
| DB cloud | Neon | PostgreSQL serverless, branching |

## Structure du projet

```
ecole-gestion/
├── README.md
├── docs/                          # Documentation projet
├── prisma/
│   ├── schema.prisma              # Schéma de données
│   ├── migrations/                # Migrations DB
│   └── seed.ts                    # Données de test
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/                # Pages d'authentification
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/           # Layout principal admin
│   │   │   ├── layout.tsx         # Sidebar + header + auth guard
│   │   │   ├── page.tsx           # Redirect vers vie-scolaire
│   │   │   └── vie-scolaire/      # Module Vie scolaire
│   │   │       ├── page.tsx       # Tableau de bord
│   │   │       ├── eleves/
│   │   │       │   ├── page.tsx           # Liste des élèves
│   │   │       │   ├── [id]/
│   │   │       │   │   └── page.tsx       # Fiche élève
│   │   │       │   └── nouveau/
│   │   │       │       └── page.tsx       # Création élève
│   │   │       ├── parents/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── [id]/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── nouveau/
│   │   │       │       └── page.tsx
│   │   │       ├── contenu-cours/
│   │   │       │   ├── page.tsx
│   │   │       │   └── nouveau/
│   │   │       │       └── page.tsx
│   │   │       ├── devoirs/
│   │   │       │   ├── page.tsx
│   │   │       │   └── nouveau/
│   │   │       │       └── page.tsx
│   │   │       ├── niveaux/
│   │   │       │   └── page.tsx
│   │   │       ├── classes/
│   │   │       │   └── page.tsx
│   │   │       └── matieres/
│   │   │           └── page.tsx
│   │   ├── api/                   # API Routes
│   │   │   ├── auth/[...nextauth]/
│   │   │   └── v1/
│   │   │       ├── eleves/
│   │   │       ├── parents/
│   │   │       ├── classes/
│   │   │       ├── niveaux/
│   │   │       ├── matieres/
│   │   │       ├── contenu-cours/
│   │   │       ├── devoirs/
│   │   │       └── absences/
│   │   ├── globals.css
│   │   └── layout.tsx             # Root layout
│   ├── components/
│   │   ├── ui/                    # shadcn/ui (boutons, inputs, etc.)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── breadcrumb.tsx
│   │   ├── shared/
│   │   │   ├── data-table.tsx     # Table générique avec tri/filtre/pagination
│   │   │   ├── export-buttons.tsx # CSV, Excel, PDF
│   │   │   ├── search-bar.tsx
│   │   │   ├── stat-card.tsx      # Card KPI dashboard
│   │   │   └── confirm-dialog.tsx
│   │   └── modules/
│   │       └── vie-scolaire/
│   │           ├── eleve-form.tsx
│   │           ├── parent-form.tsx
│   │           ├── classe-form.tsx
│   │           ├── niveau-form.tsx
│   │           ├── matiere-form.tsx
│   │           ├── contenu-cours-form.tsx
│   │           ├── devoir-form.tsx
│   │           └── appel-dialog.tsx
│   ├── lib/
│   │   ├── prisma.ts              # Client Prisma singleton
│   │   ├── auth.ts                # Configuration Auth.js
│   │   ├── auth-options.ts        # Options NextAuth
│   │   ├── utils.ts               # Utilitaires généraux
│   │   ├── exports.ts             # Fonctions d'export CSV/Excel/PDF
│   │   └── validators/
│   │       ├── eleve.ts           # Schémas Zod
│   │       ├── parent.ts
│   │       ├── classe.ts
│   │       └── ...
│   ├── hooks/
│   │   ├── use-pagination.ts
│   │   ├── use-debounce.ts
│   │   └── use-export.ts
│   ├── types/
│   │   ├── index.ts               # Types globaux
│   │   └── vie-scolaire.ts        # Types module
│   └── middleware.ts              # Auth middleware (protection routes)
├── public/
│   └── images/
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── postcss.config.js
```

## Architecture multi-tenant

### Stratégie : colonne `schoolId` sur chaque table

Chaque entité métier porte un champ `schoolId` (UUID) qui référence l'école propriétaire des données. Cette approche offre :
- Isolation logique des données par école
- Une seule base de données à maintenir
- Requêtes filtrées systématiquement par `schoolId`
- Migration simple vers un schéma par tenant si nécessaire à l'avenir

### Middleware d'isolation

```
Requête → Auth middleware → Extraction schoolId depuis session → Injection dans context → Filtre automatique sur toutes les requêtes Prisma
```

## Authentification et rôles

### Rôles définis

| Rôle | Accès |
|---|---|
| `SUPER_ADMIN` | Toutes les écoles, configuration plateforme |
| `ADMIN` | Gestion complète d'une école |
| `DIRECTEUR` | Supervision, tableaux de bord, rapports |
| `PROFESSEUR` | Ses classes, appel, contenus de cours, devoirs |
| `PERSONNEL` | Gestion courante (élèves, familles) |
| `PARENT` | Portail parent (futur — lecture seule) |

### Matrice de permissions (module Vie scolaire)

| Action | ADMIN | DIRECTEUR | PROFESSEUR | PERSONNEL |
|---|---|---|---|---|
| Dashboard complet | oui | oui | partiel (ses classes) | non |
| CRUD élèves | oui | oui | lecture | lecture |
| CRUD parents | oui | oui | lecture | oui |
| CRUD classes/niveaux | oui | oui | non | non |
| CRUD matières | oui | oui | non | non |
| Contenu de cours | oui | oui | oui (ses cours) | lecture |
| Devoirs | oui | oui | oui (ses cours) | lecture |
| Faire l'appel | oui | oui | oui (ses classes) | non |
| Exports | oui | oui | partiel | non |

## Patterns techniques

### Server Components par défaut
Toutes les pages utilisent des React Server Components. Les composants interactifs (formulaires, modals, filtres) sont marqués `"use client"`.

### Server Actions pour les mutations
Les créations, modifications et suppressions passent par des Server Actions Next.js, avec validation Zod côté serveur.

### Data fetching
- Pages : fetch direct via Prisma dans les Server Components
- Composants interactifs : Server Actions ou API routes si nécessaire
- Pas de state management client lourd (pas de Redux/Zustand pour cette phase)

### Validation
- Schémas Zod partagés entre client et serveur
- Validation côté client pour l'UX (feedback immédiat)
- Validation côté serveur obligatoire (sécurité)

### Gestion des erreurs
- Error boundaries Next.js (`error.tsx`) par segment de route
- Toast notifications pour les actions utilisateur (succès/erreur)
- Logging serveur structuré

## Conventions de code

- Nommage fichiers : `kebab-case`
- Nommage composants : `PascalCase`
- Nommage fonctions/variables : `camelCase`
- Nommage tables DB : `PascalCase` (convention Prisma)
- Nommage colonnes DB : `camelCase`
- Routes API : `/api/v1/resource` (RESTful)
- Langue du code : anglais (noms de variables, fonctions)
- Langue de l'UI : français
- Langue de la documentation : français
