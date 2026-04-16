# Plan d'implémentation — EcoleGestion

## Résumé exécutif

Ce document définit la stratégie d'implémentation du module Vie scolaire pour EcoleGestion, un SaaS destiné aux écoles arabes/coraniques/religieuses fonctionnant sur des créneaux mercredi/samedi/dimanche. Il couvre le périmètre, l'ordre de développement, les décisions techniques, les hypothèses validées et les contraintes spécifiques.

---

## 1. Périmètre de la v0.1

### Inclus
- Setup projet (Next.js 15, Prisma, Auth.js, Tailwind, shadcn/ui)
- Authentification avec rôles (login, session, middleware de protection)
- Workflow invitation parent (email + lien de création de mot de passe)
- Layout admin (sidebar, header, breadcrumb)
- Module Vie scolaire complet (8 écrans)
- Contrainte calendrier : 5 créneaux autorisés (MERCREDI_PM, SAMEDI_AM, SAMEDI_PM, DIMANCHE_AM, DIMANCHE_PM)
- CRUD complet sur toutes les entités
- Exports CSV, Excel, PDF
- Appel / gestion des présences (calcul strict des demi-journées)
- Alertes absences sur le dashboard
- Multi-tenant (données isolées par schoolId)
- Supabase Storage (photos, pièces jointes)
- Seed de données de test (contexte école coranique)

### Exclu (reporté)
- Espace parents (portail)
- Emploi du temps avancé (module dédié)
- Notes et bulletins
- Communication / messagerie (placeholders en v0.1)
- Inscription en ligne
- PWA / mode offline
- API publique
- Tests E2E
- i18n (interface en français uniquement)

---

## 2. Phases de développement

### Phase 1 — Fondations (semaine 1-2)
Infrastructure technique, authentification, layout.

| Tâche | Priorité |
|---|---|
| Init Next.js 15 + TypeScript + Tailwind + shadcn/ui | P0 |
| Configuration Prisma + PostgreSQL (Neon) | P0 |
| Setup Supabase Storage (buckets : photos-eleves, pieces-jointes-devoirs, documents-administratifs) | P0 |
| Schéma Prisma complet (avec enums TimeSlot, ClassGender) + migration initiale | P0 |
| Seed de données (école coranique, users, niveaux libres, classes non mixtes, élèves, parents, matières coraniques) | P0 |
| Auth.js v5 (credentials provider) + workflow invitation parent | P0 |
| Middleware d'authentification + protection des routes | P0 |
| Configurer les 5 créneaux horaires autorisés (constantes + validation) | P0 |
| Layout admin (sidebar, header, breadcrumb) | P0 |
| Composant DataTable générique (tri, filtre, pagination) | P0 |
| Composants export (CSV, Excel, PDF) | P1 |

### Phase 2 — Entités de configuration (semaine 2-3)
Niveaux, classes, matières — les données de référence nécessaires aux autres écrans.

| Tâche | Priorité |
|---|---|
| Page Niveaux (CRUD modale, table, libellés libres) | P0 |
| Page Classes (CRUD modale, table, genre FILLE/GARCON/MIXTE, lien niveau) | P0 |
| Page Matières (CRUD modale, table, libellés libres) | P0 |
| Validations Zod pour chaque entité | P0 |
| Cascade de sélection niveau → classe | P0 |

### Phase 3 — Élèves et parents (semaine 3-4)
Cœur fonctionnel du module.

| Tâche | Priorité |
|---|---|
| Page liste élèves (table, recherche, filtres) | P0 |
| Page création/édition élève (formulaire complet, compatibilité genre/classe) | P0 |
| Page fiche élève (lecture, onglets) | P0 |
| Génération automatique du matricule | P0 |
| Page liste parents (table, recherche, statut invitation) | P0 |
| Page création parent (formulaire + création User + envoi email invitation) | P0 |
| Liaison parent-élève (création, modification) | P0 |
| Placeholders messagerie (toast "Messagerie bientôt disponible") | P1 |
| Ajout frère/sœur | P1 |
| Exports CSV/Excel/PDF sur les listes | P1 |

### Phase 4 — Contenu pédagogique (semaine 4-5)
Contenu de cours et devoirs.

| Tâche | Priorité |
|---|---|
| Page contenu de cours (formulaire + liste, validation jours autorisés) | P1 |
| Page devoirs (formulaire + liste, date limite sur jour de cours) | P1 |
| Calcul automatique du statut des devoirs | P1 |
| Upload pièce jointe via Supabase Storage | P1 |

### Phase 5 — Appel et dashboard (semaine 5-6)
Fonctionnalités transversales.

| Tâche | Priorité |
|---|---|
| Modale d'appel (liste élèves, statuts, créneau TimeSlot) | P1 |
| Calcul strict des demi-journées d'absence | P1 |
| Dashboard : KPIs (enseignants, élèves, classes, présence) | P1 |
| Dashboard : planning semaine (mercredi PM / samedi / dimanche uniquement) | P1 |
| Dashboard : prochains cours avec bouton d'appel | P1 |
| Dashboard : absences de la dernière séance | P1 |
| Dashboard : alertes (élèves ≥ 4 demi-journées) | P1 |

### Phase 6 — Polish (semaine 6-7)
Finitions, tests, déploiement.

| Tâche | Priorité |
|---|---|
| Empty states sur tous les écrans | P2 |
| Loading states (skeletons) | P2 |
| Gestion d'erreurs (error.tsx, toasts) | P1 |
| Responsive design (tables → cards mobile) | P2 |
| Tests unitaires des règles métier (dont calcul demi-journées strict) | P1 |
| Déploiement Vercel + Neon | P1 |
| Revue de sécurité (injection, XSS, auth) | P1 |

---

## 3. Décisions techniques

### D1 — Server Components par défaut
Les pages et layouts sont des Server Components. Seuls les composants interactifs (formulaires, modales, filtres dynamiques) sont `"use client"`.

**Raison** : performance, moins de JS côté client, accès direct à Prisma.

### D2 — Server Actions pour les mutations
Pas d'API routes pour le CRUD interne. Les Server Actions Next.js 15 gèrent les créations, modifications, suppressions.

**Raison** : colocalisé avec les composants, type-safe, pas de sérialisation manuelle.

### D3 — Pas de state manager client
Pas de Redux, Zustand ou autre. Le state est géré par :
- URL params (filtres, pagination)
- Server Components (données initiales)
- React state local (formulaires, modales)

**Raison** : la complexité ne le justifie pas pour la v0.1.

### D4 — DataTable générique
Un composant `DataTable` réutilisable basé sur `@tanstack/react-table` + shadcn/ui.

**Raison** : toutes les pages ont des tables avec tri, filtre, pagination. Factoriser dès le début.

### D5 — Validation Zod partagée
Les schémas Zod sont définis une fois et utilisés côté client (formulaire) ET côté serveur (Server Action).

**Raison** : cohérence des validations, DRY.

### D6 — Horaires en String "HH:MM"
Les créneaux horaires sont stockés en String et non en type Time PostgreSQL.

**Raison** : Prisma ne supporte pas nativement le type `Time` de PostgreSQL. Le format String est suffisant et simple à manipuler.

### D7 — Année scolaire obligatoire
Toutes les classes sont liées à une année scolaire. L'année courante est marquée `isCurrent = true`.

**Raison** : permet l'historique et la transition entre années scolaires.

### D8 — Enum TimeSlot pour les créneaux autorisés
Les 5 créneaux (MERCREDI_PM, SAMEDI_AM, SAMEDI_PM, DIMANCHE_AM, DIMANCHE_PM) sont un enum Prisma, pas une configuration dynamique.

**Raison** : contrainte structurelle inviolable. Empêche toute erreur de saisie de jour invalide au niveau du schéma.

### D9 — Supabase Storage pour les fichiers
Photos d'élèves et pièces jointes de devoirs stockés sur Supabase Storage.

**Raison** : tier gratuit généreux (1 Go), compatible Next.js, API simple, évolutif. Trois buckets : `photos-eleves`, `pieces-jointes-devoirs`, `documents-administratifs`.

### D10 — Français uniquement, pas d'i18n
L'interface est en français. Pas de framework d'internationalisation en v0.1.

**Raison** : les écoles arabes/coraniques en France fonctionnent en français pour l'administration. L'arabe est la langue enseignée, pas la langue d'interface.

---

## 4. Hypothèses validées

Toutes les questions ouvertes ont été résolues. Voici les hypothèses validées :

| # | Hypothèse | Statut | Détail |
|---|---|---|---|
| H1 | Un élève appartient à une seule classe à la fois | Validé | Si multi-classe nécessaire, table de liaison future. |
| H2 | L'appel se fait par créneau, pas par demi-journée | Validé | Le calcul de demi-journée est dérivé (calcul strict). |
| H3 | Le seuil d'alerte (4 demi-journées) est fixe en v0.1 | Validé | Configurable par école en v0.2 via settings. |
| H4 | Un parent = un compte utilisateur | Validé | Chacun a son email, pas de compte partagé. |
| H5 | Mot de passe via email d'invitation (pas saisi par l'admin) | Validé | Workflow invite : token → email → lien → parent définit son MDP. |
| H6 | L'école fonctionne mercredi PM + samedi + dimanche uniquement | Validé | 5 demi-journées max/semaine. Enum TimeSlot. |
| H7 | Les exports sont côté client | Validé | Suffisant pour ~500 élèves. |
| H8 | Un retard > 15 min = absence | Validé | Seuil fixe en v0.1. Configurable en v0.2. |
| H9 | Les contenus de cours modifiables 7 jours max (professeur) | Validé | Admin peut toujours modifier. |
| H10 | Communication = placeholder en v0.1 | Validé | Toast "Messagerie bientôt disponible". Module dédié plus tard. |
| H11 | Genre de classe : enum explicite FILLE/GARCON/MIXTE | Validé | Défaut GARCON (non mixte par défaut). |
| H12 | Calcul demi-journées : strict (absent à TOUS les créneaux) | Validé | Pas de comptage simplifié. |
| H13 | Niveaux et matières : texte libre | Validé | Pas de niveaux standards type Éducation nationale. |
| H14 | Période par défaut : TRIMESTRE | Validé | Variable par classe. |
| H15 | Stockage fichiers : Supabase Storage | Validé | Buckets : photos-eleves, pieces-jointes-devoirs, documents-administratifs. |
| H16 | Interface en français uniquement | Validé | Pas d'i18n en v0.1. |

---

## 5. Composants réutilisables à créer

| Composant | Usage |
|---|---|
| `DataTable` | Toutes les pages de liste |
| `StatCard` | KPIs du dashboard |
| `ExportButtons` | Barre d'actions en haut des listes |
| `SearchBar` | Recherche textuelle |
| `FilterBar` | Filtres par select |
| `ConfirmDialog` | Confirmation avant suppression |
| `FormModal` | Modales de création/édition (niveaux, classes, matières) |
| `PageHeader` | Titre + actions en haut de chaque page |
| `EmptyState` | État vide avec message et action |
| `LoadingSkeleton` | Skeleton pendant le chargement |
| `Breadcrumb` | Navigation contextuelle |
| `AppelModal` | Modale d'appel spécifique |
| `WeekPlanning` | Planning hebdo (3 jours : mercredi/samedi/dimanche) |
| `PlaceholderToast` | Toast "Messagerie bientôt disponible" |

---

## 6. Sécurité

### Authentification
- Toutes les routes sous `/(dashboard)` sont protégées par le middleware Auth.js.
- Redirection vers `/login` si non authentifié.
- Session JWT avec rôle et schoolId.
- Workflow invitation parent sécurisé (token unique, expiration).

### Autorisation
- Vérification du rôle à chaque Server Action.
- Vérification du schoolId à chaque requête Prisma (isolation tenant).
- Un professeur ne voit que ses propres données (classes, cours).

### Données
- Mots de passe hashés (bcrypt).
- Tokens d'invitation hashés ou signés (pas en clair en DB).
- Validation Zod côté serveur obligatoire (jamais faire confiance au client).
- Paramètres de requête sanitisés (pas d'injection SQL via Prisma).
- Headers CSP configurés.
- RGPD : données d'enfants mineurs — accès strictement contrôlé.
- Supabase Storage : buckets avec policies d'accès (lecture authentifiée uniquement).

---

## 7. Performance

### Objectifs
- Temps de chargement initial < 2s
- Navigation entre pages < 500ms (RSC streaming)
- Liste de 500 élèves : rendu < 1s

### Stratégies
- Server Components pour le rendu initial (pas de waterfall client)
- Pagination côté serveur (jamais charger tous les élèves d'un coup)
- Index DB sur les colonnes de recherche et de filtre
- Cache Next.js pour les données peu volatiles (niveaux, matières)
- Lazy loading des composants lourds (exports, modales)

---

## 8. Déploiement

### Environnements
- **Développement** : local (Next.js dev server + PostgreSQL local ou Neon branch)
- **Staging** : Vercel preview (branche `develop`)
- **Production** : Vercel production (branche `main`)

### Variables d'environnement
```
DATABASE_URL=                    # URL PostgreSQL Neon
NEXTAUTH_SECRET=                 # Secret Auth.js
NEXTAUTH_URL=                    # URL du site
NEXT_PUBLIC_SUPABASE_URL=        # URL Supabase projet
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Clé publique Supabase
SUPABASE_SERVICE_ROLE_KEY=       # Clé service Supabase (server-side only)
EMAIL_SERVER=                    # SMTP pour emails d'invitation
EMAIL_FROM=                      # Adresse expéditeur
```

### CI/CD
- Déploiement automatique via Vercel Git integration
- Migrations Prisma exécutées manuellement ou via script de déploiement
- Pas de CI complexe en v0.1 (à ajouter en v0.2)
