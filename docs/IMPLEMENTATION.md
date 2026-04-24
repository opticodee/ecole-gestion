# Plan d'implémentation — EcoleGestion

## Résumé exécutif

Ce document définit la stratégie d'implémentation du module Vie scolaire pour EcoleGestion, un SaaS destiné aux écoles arabes/coraniques/religieuses fonctionnant sur des créneaux mercredi/samedi/dimanche. Il couvre le périmètre, l'ordre de développement, les décisions techniques, les hypothèses validées et les contraintes spécifiques.

---

## 0. État d'avancement (mis à jour 2026-04-23)

**Statut global : Module Vie Scolaire fonctionnellement complet (20 pages, 25 routes). Phase 6 polish/déploiement non démarrée. npm run build : 0 erreur.**

### Architecture de routing

Depuis le 2026-04-17, l'application est organisée par **modules** :

- **`/admin/modules`** — Page d'entrée post-login avec 4 cartes (Vie Scolaire active, les 3 autres marquées "Bientôt")
- **`/admin`** — Redirige vers `/admin/modules`
- **`/admin/vie-scolaire/*`** — Toutes les pages du module Vie Scolaire (avec sidebar dédiée + lien "Retour aux modules")
- Les modules futurs (Planning, Communication, Facturation) auront leur propre sous-route et leur propre sidebar

### Pages livrées (module Vie Scolaire)

| Route | Contenu | Statut |
|---|---|---|
| `/login` | Auth credentials (Auth.js v5) | ✓ |
| `/admin/modules` | Sélecteur de modules post-login (4 cartes, 1 active) | ✓ |
| `/admin/vie-scolaire` | Dashboard : 4 KPIs + planning semaine + prochains cours + alertes absences + activité récente | ✓ |
| `/admin/vie-scolaire/eleves` | Liste élèves (recherche, filtres, pagination, exports CSV/Excel/PDF) | ✓ |
| `/admin/vie-scolaire/eleves/[id]` | Fiche élève (onglets : infos, parents, scolarité, absences) | ✓ |
| `/admin/vie-scolaire/parents` | Liste parents (filtres, statut invitation) | ✓ |
| `/admin/vie-scolaire/parents/[id]` | Fiche parent + enfants liés | ✓ |
| `/admin/vie-scolaire/classes` | CRUD classes (genre FILLE/GARCON/MIXTE, prof attitré, créneau unique) | ✓ |
| `/admin/vie-scolaire/niveaux` | CRUD niveaux libres (agrégations inscrits/capacité) | ✓ |
| `/admin/vie-scolaire/matieres` | CRUD matières hiérarchiques (parent/enfant, arbre accordéon) | ✓ |
| `/admin/vie-scolaire/contenu-cours` | CRUD journal de cours (titre, contenu, objectifs, remarques) | ✓ |
| `/admin/vie-scolaire/devoirs` | CRUD devoirs (titre, description, consignes, échéance, statut auto) | ✓ |
| `/admin/vie-scolaire/appel` | Page dédiée : sélecteur + pastilles semaine + historique paginé + filtres + détail + export CSV + stats | ✓ |
| `/admin/vie-scolaire/evaluations` | Liste évaluations (filtres, CRUD, lock, exports CSV/Excel/PDF/Imprimer) | ✓ |
| `/admin/vie-scolaire/evaluations/[id]/notes` | Saisie notes (table + absent, stats temps réel, brouillon/verrouiller, export CSV) | ✓ |
| `/admin/vie-scolaire/notes` | Récapitulatif notes & moyennes (grille classe, vue élève, rangs, codes couleur, exports) | ✓ |
| `/admin/vie-scolaire/appreciations` | Saisie appréciations (générale + par matière, suggestions rapides) | ✓ |
| `/admin/vie-scolaire/mentions` | Mentions automatiques + override manuel + commentaire conseil | ✓ |
| `/admin/vie-scolaire/bulletins` | Readiness panel + aperçu modale + PDF A4 individuel/bulk | ✓ |
| `/admin/vie-scolaire/conseil-classe` | Décisions 9 options + observation + PV PDF avec signatures | ✓ |
| `/admin/vie-scolaire/livret` | Vue agrégée année × trimestres + PDF A4 multi-pages | ✓ |
| `/admin/vie-scolaire/passage` | Décisions passage (enum) + vérifications capacité/genre + application irréversible | ✓ |
| `/admin/vie-scolaire/enseignants` | CRUD enseignants (création User + Teacher, exports, filtres) | ✓ |
| `/admin/vie-scolaire/enseignants/[id]` | Fiche prof : infos, classes, emploi du temps 5 créneaux, stats | ✓ |
| `/admin/vie-scolaire/emploi-du-temps` | Grille calendrier 3×2 (Mercredi/Samedi/Dimanche × Matin/Après-midi) avec multi-classes par créneau, 3 vues, navigation semaine, pastilles appel, export PDF paysage | ✓ |
| `/admin/vie-scolaire/annee-scolaire` | Cycle BROUILLON → ACTIVE → CLOTUREE, pré-remplissage intelligent, dropdown année dans le header | ✓ |

### Fonctionnalités terminées

- **Auth** : login credentials, session JWT avec `schoolId`/`role`/`userId`, middleware de protection, redirection post-login vers `/admin/modules`
- **Multi-tenant** : isolation par `schoolId` sur toutes les requêtes Prisma
- **Seed** : école coranique de démo, 1 admin + 1 directeur, 5 enseignants (avec genre), 8 classes (dont 3 sur SAMEDI_AM pour démo multi-classes), 37 élèves, 52 parents, **17 matières hiérarchiques**, **5 évaluations (3 verrouillées avec 17 notes)**, **37 appréciations + mentions + décisions conseil (T1)**, 148 enregistrements d'appel, année scolaire 2025-2026 **ACTIVE** avec dates de trimestres
- **CRUD complet** : niveaux, classes, matières (avec hiérarchie), élèves, parents, enseignants, contenus de cours, devoirs, évaluations, notes, années scolaires
- **Hiérarchie matières** : `Subject.parentId` (self-ref, `onDelete: Cascade`), rendu en arbre accordéon, suppression cascade, nesting 2 niveaux max
- **Module Évaluations** : modèles `Evaluation` + `Grade`, CRUD complet, formulaire dynamique (coef auto 2/1 selon type, prof auto-rempli via `class.mainTeacher`, sous-matière filtrée), mécanisme de verrouillage (isLocked bloque edit/delete)
- **Saisie notes** : table élèves + input note + checkbox absent, stats temps réel (moyenne/max/min/noté/absent), "Enregistrer brouillon" + "Valider et verrouiller" (modale confirm, requiert note ou absent pour chaque élève), lecture seule si verrouillé
- **Chaîne bulletin complète** : notes+moyennes (rangs, codes couleur, exports) → appréciations (générale + par matière, suggestions) → mentions (auto Excellent/TB/B/Passable/Insuffisant + override manuel 9 options) → bulletins (aperçu + PDF A4 individuel/bulk) → conseil de classe (décisions + PV PDF signatures) → livret scolaire (vue agrégée + PDF multi-pages) → passage de classe (application irréversible avec vérifications)
- **CRUD Enseignants** : création transactionnelle User PROFESSEUR + Teacher avec mot de passe temporaire hashé, fiche avec emploi du temps 5 créneaux, navigation croisée depuis page Classes
- **Emploi du temps visuel** : grille 3 colonnes (Mercredi/Samedi/Dimanche) × 2 lignes (Matin/Après-midi) avec Mercredi matin grisé "Pas de cours". Support **plusieurs classes par créneau** : cards stackées en taille full/compact/ultra selon le nombre, bouton "+N autres" + dialog si 4+. 3 vues (ALL / BY_TEACHER / BY_CLASS). Cards colorées par genre (FILLE rose / GARCON bleu / MIXTE violet). Pastille appel 4 états. Navigation semaine + bouton "Aujourd'hui". Modale détail avec actions (appel, classe, contenu, devoir, fiche prof). 5 KPIs + tableau récap dépliable. Exports CSV + PDF A4 paysage + impression. Responsive (grille desktop → liste mobile).
- **Année scolaire** : enum `AcademicYearStatus` (BROUILLON/ACTIVE/CLOTUREE), cycle de vie strict, `isCurrent` dénormalisé pour rétro-compat, cards empilées avec bordure colorée par statut, formulaire avec pré-remplissage intelligent (libellé auto YYYY-YYYY+1, endDate=30/06, trimestres T1 01/09→20/12 / T2 05/01→28/03 / T3 06/04→30/06). Activation avec conflit (modale "Clôturer X et activer Y"). Clôture irréversible avec warning si passages non appliqués. Suppression brouillon uniquement sans données. Helper `getActiveAcademicYear(schoolId)` + garde `assertYearNotClosed(id)`. Dropdown YearSwitcher dans le header + bandeau jaune ArchiveBanner (visuel v0.1).
- **Liaison parent ↔ élève** : création depuis fiche parent ou fiche élève, ajout frère/sœur
- **Contrôles métier** : capacité classe, compatibilité genre élève/classe, protection suppression si dépendances
- **Appel** : modale P/A/R avec champ lateMinutes, retard > 15 min → ABSENT automatique, upsert par `(scheduleId, studentId, date)`, modification possible
- **Dashboard** : KPIs agrégés, planning des 5 créneaux de la semaine courante, alertes élèves ≥ 4 absences, activité récente (5 derniers contenus + devoirs)
- **Historique appel** : groupé par (classe, date, créneau), filtres serveur, pagination 15/page, détail en modale, export CSV avec BOM UTF-8
- **Exports** : CSV/Excel/PDF sur liste élèves, CSV sur historique appel, CSV/Excel/PDF/Imprimer sur liste évaluations, CSV sur saisie notes, PDF A4 bulletins individuels et bulk, PV conseil PDF, livret PDF, emploi du temps PDF paysage, CSV/PDF décisions de passage
- **Dropdowns harmonisés** : helper `toSelectItems()` dans `src/components/ui/select.tsx` + prop `items` sur chaque `<Select.Root>` (Base UI API officielle) — affiche le label au lieu de l'UUID (~50 dropdowns corrigés). `SelectContent` par défaut en mode popper (`alignItemWithTrigger=false`) + `max-h-60 overflow-y-auto` pour éviter le saut visuel à la sélection.

### Décisions prises le 2026-04-23

1. **Chaîne bulletin complète** : 4 pages enchaînées (notes → appréciations → mentions → bulletins) + conseil + livret + passage. Partage d'un helper `src/lib/bulletin.ts` (périodes T1=sept-déc / T2=jan-mars / T3=avr-juin, weightedAverage, simpleAverage pour overall, computeRanks, computeAutoMention seuils 9/8/7/5).
2. **Modèle `Appreciation`** (migration `20260423131354_add_appreciations_mentions`) : `generalComment`, `subjectComments` Json keyé par subjectId top-level, `autoMention`/`manualMention`, `councilComment`. Unique `(studentId, classGroupId, period, academicYearId)`.
3. **Champs conseil de classe** (migration `20260423134648_add_council_fields`) : `councilDecision` (enum 9 options) + `councilObservation` ajoutés à Appreciation. Idem migration ajoute le modèle `ClassTransition` et enum `TransitionDecision` (PASSAGE/REDOUBLEMENT/DEPART/EN_ATTENTE).
4. **Modèle `ClassTransition`** : `fromClassGroupId`, `decision` (enum), `toClassGroupId?`, `toLevelId?`, `observation`, `isApplied`, unique `(studentId, academicYearId)`. Action `applyTransitions()` vérifie capacité + compatibilité genre avant d'effectuer les déplacements irréversibles.
5. **Teacher étendu** (migration `20260423133354_add_teacher_fields`) : ajout de `gender`, `address`, `dateOfBirth` sur Teacher. Création transactionnelle User PROFESSEUR + Teacher avec mot de passe temporaire hashé `ChangeMe2026!`.
6. **Multi-classes par créneau** : `Schedule` autorise plusieurs classes sur le même `timeSlot` tant qu'elles ont des `classGroupId` différents. L'emploi du temps gère le stacking visuel (card size 'full'/'compact'/'ultra' selon le nombre, overflow modal pour 4+).
7. **`AcademicYear` étendu** (migration `20260423144311_add_academic_year_status`) : enum `AcademicYearStatus` (BROUILLON/ACTIVE/CLOTUREE) + 6 champs trimestres + `closedAt`. `isCurrent` conservé dénormalisé (synchronisé avec `status=ACTIVE`) pour que les queries existantes sur `{ isCurrent: true }` continuent à fonctionner sans refactor.
8. **Helper server-only vs client-safe** : les constantes (labels, couleurs) d'AcademicYear vivent dans `src/lib/academic-year.ts` (client-safe). Les helpers Prisma (`getActiveAcademicYear`, `assertYearNotClosed`) vivent dans `src/server/actions/academic-years.ts` pour éviter qu'un composant client importe transitivement Prisma (erreur "Can't resolve 'tls'").
9. **Fix dropdowns Base UI** : la prop `items` sur `Select.Root` dit à `<Select.Value>` comment afficher le label de la sélection — sans elle, Base UI affiche la valeur brute (UUID). Helper `toSelectItems(list, valueKey, labelKey)` centralisé + passé sur chaque Select (~50 dropdowns).
10. **Fix saut dropdown** : défaut `alignItemWithTrigger=false` sur `SelectContent` (équivalent de `position="popper"` côté Radix) + `max-h-60 overflow-y-auto`. Appliqué une seule fois dans `src/components/ui/select.tsx`, pas de changement par site d'usage.

### Décisions prises le 2026-04-17

1. **Architecture modulaire** : séparation des modules en sous-routes `/admin/<module>/*` — sidebar par module, page d'entrée `/admin/modules` pour la sélection
2. **Hiérarchie matières parent/enfant** : `Subject.parentId` self-référentiel, cascade delete, 2 niveaux max (pas de petits-enfants). Seed : Général, Langue arabe + 7 enfants, Comportement, Éducation musulmane + 4 enfants, Coran + 1 enfant
3. **Modèles `Evaluation` + `Grade`** (migration `20260417134339_add_subject_hierarchy_evaluations_grades`) :
   - `Evaluation` : `mode` (INDIVIDUAL/GROUP), `type` (CONTROLE/EXAMEN), `coefficient` (défaut 2), `scale` (défaut 10), `isLocked`
   - `Grade` : `score: Float?`, `isAbsent: Boolean`, unique sur `(evaluationId, studentId)`
4. **Coefficient auto** : CONTROLE → 2, EXAMEN → 1 (modifiable, uniquement en création)
5. **Prof auto-rempli** dans le form Évaluations depuis `class.mainTeacherId`
6. **Sous-matière filtrée** : le dropdown "Sous-matière" propose uniquement les enfants de la matière sélectionnée
7. **Mode évaluation** : seul le mode `GROUP` est exposé dans l'UI v0.1 — le mode `INDIVIDUAL` est prêt côté DB mais pas dans le formulaire
8. **Lock irréversible** : une évaluation verrouillée ne peut plus être modifiée ni supprimée (bouton désactivé, modal confirm avant lock)
9. **Notes : validation lock** : pour verrouiller, chaque élève doit avoir une note OU être marqué absent (brouillon plus permissif)

### Décisions conservées (2026-04-16)

1. **Modèle 1 classe = 1 prof** : chaque classe a un `mainTeacherId` unique qui enseigne toutes les matières. La table `TeacherSubject` existe mais n'est plus utilisée.
2. **Schedule simplifié** : plus de `subjectId` ni `teacherId`. Une classe a un seul `Schedule` (un `TimeSlot` + horaires + salle).
3. **`CourseContent.subjectId` et `Homework.subjectId` nullables** (migration `20260416200000_add_course_content_homework_fields`).
4. **Prof auto-rempli** : formulaires Contenu/Devoirs/Évaluations n'ont plus de dropdown prof.
5. **Supabase Storage non déployé** : clients configurés (`src/lib/supabase.ts`) mais buckets non créés.
6. **Invitation parent reportée** : création parent crée un `User` sans envoyer d'email.
7. **Retard > 15 min → absence** : constante `LATE_TO_ABSENT_MINUTES`.
8. **Seuil alerte absences ≥ 4** : constante `ABSENCE_ALERT_THRESHOLD`.
9. **Pagination** 10/page sur Contenu/Devoirs/Évaluations, 15/page sur historique Appel.

### Reste à faire (mis à jour 2026-04-23)

**Périmètres identifiés pour les prochaines itérations**
- **Espace Professeur** : dashboard prof filtré sur ses classes, appel autonome, saisie notes, contenu de cours, devoirs (phase 5.3.x du backlog)
- **Import CSV élèves/parents** : upload + mapping colonnes + validation + création en masse avec rapport d'erreurs
- **Espace Parents** (portail) : vue notes de ses enfants, bulletins téléchargeables, consultation appel, messagerie (placeholder)
- **Page Paramètres** : configuration école (nom, logo, coordonnées, timezone), paramètres d'année (jours de cours, créneaux personnalisés), préférences
- **Gestion utilisateurs admin** : CRUD ADMIN/DIRECTEUR/PERSONNEL depuis l'interface (actuellement seeds uniquement)
- **Déploiement Vercel + Neon** : configuration env, script de migration, monitoring

**Fonctionnel restant**
- **Mode `INDIVIDUAL`** dans le formulaire évaluation (modèle prêt côté DB, UI GROUP-only)
- **Espace Prof** (phase 5.3) : dashboard filtré, restriction d'accès aux classes assignées

**Infra bloquante**
- Supabase Storage (3 buckets + policies + helpers) → upload photo élève, pièces jointes devoirs
- Service email (Resend recommandé) → workflow invitation parent (token + lien MDP), renvoi d'invitation

**Règles métier**
- Restriction modification 7 jours côté prof (contenu, devoirs, notes non verrouillées)
- Calcul strict demi-journées d'absence (absent à TOUS les créneaux d'une demi-journée)
- Enforcement `assertYearNotClosed` dans les Server Actions existantes (grades, attendance, evaluations) pour bloquer les écritures sur une année CLOTUREE si l'archive devient navigable

**Phase 6 — Polish / déploiement**
- Empty states homogènes, loading skeletons, error boundaries
- Responsive tables → cards mobile (polish ciblé)
- Tests unitaires règles métier (calcul demi-journées, validations, pré-remplissage année)
- Déploiement Vercel + Neon
- Revue de sécurité (RLS, injection, XSS, tokens)

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
