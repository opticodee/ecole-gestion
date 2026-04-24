# Changelog — EcoleGestion

Toutes les modifications notables du projet sont documentées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

---

## [0.1.0-dev] — 2026-04-23

Grosse journée : chaîne bulletin complète, CRUD Enseignants, Emploi du temps visuel multi-classes, Année scolaire, 2 correctifs transversaux sur les dropdowns.

### Ajouté

#### Chaîne bulletin (4 pages enchaînées)
- **`/admin/vie-scolaire/notes`** — Récapitulatif notes & moyennes : tableau large avec sous-colonnes par matière principale (+ moyenne matière en fond coloré + rang), codes couleur note (vert ≥ 8 / orange 5-8 / rouge < 5) + fond ligne (vert clair ≥ 9 / rouge clair < 5). Vue classe / vue élève. Exports CSV/Excel/PDF/Imprimer.
- **`/admin/vie-scolaire/appreciations`** — Saisie par classe/trimestre, grille élève × matières principales, textarea générale avec dropdown 7 suggestions rapides, textareas par matière, bouton "Enregistrer".
- **`/admin/vie-scolaire/mentions`** — Mention auto calculée (seuils 9/8/7/5 → Excellent/TB/B/Passable/Insuffisant) + dropdown override manuel 9 options (Félicitations, Encouragements, Avertissement travail/comportement, etc.) + commentaire conseil. `autoMention` recalculée à chaque save.
- **`/admin/vie-scolaire/bulletins`** — Readiness panel 3 checks (notes verrouillées, appréciations, mentions) avec deeplink vers pages manquantes. Aperçu modale (BulletinDocument web) + PDF A4 individuel et bulk via jsPDF (en-tête vert ACMSCHOOL, tableau matières/éval/coef/moy, KPIs moy.générale+rang+moy.classe, badge mention, appréciations + observation conseil, pied signature).

#### Conseil de classe, livret, passage
- **`/admin/vie-scolaire/conseil-classe`** — Tableau lecture seule (moyenne, rang, absences, mention, appréciation) + colonnes éditables décision (9 options) + observation. Résumé 4 KPIs. PV PDF A4 avec en-tête vert + tableau + signatures directeur/enseignant.
- **`/admin/vie-scolaire/livret`** — Vue agrégée par année × trimestres : carte par année (moyenne annuelle) + chaque trimestre avec moyenne, rang, absences, mention, décision conseil, tableau matière × moy × appréciation. PDF A4 multi-pages avec pagination.
- **`/admin/vie-scolaire/passage`** — Modèle `ClassTransition` (enum PASSAGE/REDOUBLEMENT/DEPART/EN_ATTENTE) + tableau décisions avec vérification capacité/genre + bouton "Appliquer les passages" irréversible (modale confirm, déplace `classGroupId`, passe DEPART → status RADIE, marque `isApplied=true`). Une fois appliqué, lecture seule avec badge "Passages appliqués".

#### Page Enseignants
- **`/admin/vie-scolaire/enseignants`** — Liste paginée (15/page) : genre/nom/prénom/email/téléphone/classes assignées (badges cliquables)/nb classes/statut/actions. Recherche nom/prénom + filtre statut + exports CSV/Excel/PDF/Imprimer.
- **`/admin/vie-scolaire/enseignants/[id]`** — Fiche : 3 cards top (Infos personnelles, Stats avec élèves/évaluations/taux présence, Compte utilisateur) + tableau Classes assignées (cliquables) + Emploi du temps 5 créneaux avec créneaux "Libre" en italique gris.
- **Création transactionnelle** User PROFESSEUR + Teacher avec password hashé `ChangeMe2026!`. Suppression bloquée si prof est `mainTeacherId` d'une classe. Désactivation bloquée si classes assignées.
- Navigation croisée : prof cliquable depuis la page Classes → fiche enseignant.

#### Emploi du temps visuel (page phare)
- **`/admin/vie-scolaire/emploi-du-temps`** — Grille calendrier 3 colonnes (Mercredi/Samedi/Dimanche) × 2 lignes (Matin 09:00–12:00 / Après-midi 14:00–17:00). Mercredi matin grisé "Pas de cours".
- **Support multi-classes par créneau** : `cells: Partial<Record<TimeSlot, TimetableClassCell[]>>`. Cards stackées avec prop `size` adaptative :
  - 1 classe → `full` (toutes infos, bouton "Faire l'appel")
  - 2 classes → `compact` (padding réduit)
  - 3 classes → `ultra` (horaires + niveau masqués)
  - 4+ classes → 3 premières + bouton `+N autres classes` qui ouvre un `Dialog` listant toutes les classes du créneau
- Cards colorées par genre : FILLE rose, GARCON bleu, MIXTE violet. Pastille appel 4 états (Fait vert / Partiel ambre / Non fait rouge / À venir gris).
- **3 vues** : ALL (toutes les classes), BY_TEACHER (filtre + cases vides → "Disponible" en vert cliquable), BY_CLASS (ring primary sur la classe cible, autres créneaux dimmed avec compteur "N classes").
- Navigation semaine avec flèches `<` `>` + bouton "Aujourd'hui" qui recharge via `useTransition`. Titre "Semaine du JJ/MM au JJ/MM".
- Modale détail (`TimetableDetailModal`) au clic sur une card : infos classe, dernier contenu de cours, dernier devoir, 5 actions (Appel via `AttendanceTriggerButton`, Classe, Contenu, Devoir, Fiche prof).
- 5 KPIs (Créneaux occupés % + barre, Total classes planifiées, Total élèves planifiés, Enseignants actifs, Créneaux libres) + tableau récap dépliable (1 ligne par classe).
- Exports CSV + PDF A4 paysage (grille visuelle reconstituée avec jusqu'à 3 blocs par case + badge `+N autres` si overflow, + tableau récap autoTable) + impression via `@media print` global (`@page size: A4 landscape`).
- Responsive : grille desktop lg → liste verticale empilée mobile.

#### Année scolaire (cycle de vie)
- **`/admin/vie-scolaire/annee-scolaire`** — Cards empilées avec bordure gauche colorée par statut (vert ACTIVE / orange BROUILLON / gris CLOTUREE), titre + dates + badges trimestres + stats (élèves/classes/évals/appréciations) + actions conditionnelles.
- **Cycle BROUILLON → ACTIVE → CLOTUREE** : une seule année ACTIVE à la fois. Activation avec conflit propose "Clôturer X et activer Y" en transaction atomique. Clôture irréversible avec warning si passages non appliqués (`pendingPassages`/`unappliedTransitions`) + deeplink vers `/passage`. Suppression brouillon uniquement si sans données.
- **Formulaire avec pré-remplissage intelligent** : en entrant la date de début (ex: 01/09/2026), le libellé (`2026-2027`), endDate (`30/06/2027`) et les 3 trimestres s'auto-remplissent (T1 01/09→20/12, T2 05/01→28/03, T3 06/04→30/06). L'utilisateur peut écraser tout champ — un flag `userTouched*` empêche le pré-remplissage d'écraser après édition manuelle.
- **Header `YearSwitcher`** dropdown listant toutes les années (ACTIVE en haut, archives CLOTUREE en dessous, brouillons en bas). Bandeau jaune `ArchiveBanner` affiché quand `?year=...` pointe sur une année CLOTUREE (visuel v0.1 : les Server Actions utilisent toujours l'année ACTIVE via `getActiveAcademicYear`).
- **Helpers** : `getActiveAcademicYear(schoolId)` et `assertYearNotClosed(id)` côté server action ; constantes `ACADEMIC_YEAR_STATUS_LABELS/COLORS` côté `src/lib/academic-year.ts` client-safe.
- **Sidebar** : lien "Année scolaire" (icône CalendarDays) en **1ère position**.

#### Modèles & migrations
- **`Appreciation`** (migration `20260423131354_add_appreciations_mentions`) : `schoolId`, `studentId`, `classGroupId`, `academicYearId`, `period Int` (1-3), `generalComment`, `subjectComments Json`, `autoMention`, `manualMention`, `councilComment`. Unique `(studentId, classGroupId, period, academicYearId)`.
- **Extension `Teacher`** (migration `20260423133354_add_teacher_fields`) : ajout `gender`, `address`, `dateOfBirth`.
- **Extension `Appreciation` + `ClassTransition`** (migration `20260423134648_add_council_fields`) : ajout `councilDecision` + `councilObservation` sur Appreciation ; nouveau modèle `ClassTransition` ; enum `TransitionDecision`.
- **Extension `AcademicYear`** (migration `20260423144311_add_academic_year_status`) : enum `AcademicYearStatus` + `status`, 6 champs `trimestreXStart/End`, `closedAt`, `updatedAt`. `isCurrent` conservé dénormalisé (synchronisé avec `status=ACTIVE`) pour que les `where: { isCurrent: true }` existantes continuent à fonctionner.

#### Composants réutilisables
- `src/lib/bulletin.ts` : périodes T1/T2/T3/ALL, `getPeriodRange`, `weightedAverage`, `simpleAverage`, `computeRanks`, `computeAutoMention`, `MENTION_LABELS`/`MENTION_COLORS`, `APPRECIATION_SUGGESTIONS`.
- `src/lib/validators/{appreciation,mention,council,transition,teacher,academic-year}.ts`.
- `src/components/modules/vie-scolaire/{grades-summary,appreciations,mentions,bulletins,council,livret,transitions,teachers,timetable,academic-years}/` — 9 nouveaux dossiers, ~30 composants.
- `src/components/admin/year-switcher.tsx` : YearSwitcher + ArchiveBanner.
- `src/components/ui/select.tsx` : helper `toSelectItems(list, valueKey, labelKey)` pour construire la prop `items` de Base UI `Select.Root`.

#### Seed enrichi
- 2025-2026 passe à `status: 'ACTIVE'` avec trimestres renseignés.
- 8 classes (dont 3 sur SAMEDI_AM pour démo multi-classes : Débutants-Mixte/Lahlou/Salle 1, Arabe A1-Garçons/Mansouri/Salle 2, Tajwid Initiation-Filles/Rahmani/Salle 3).
- 5 enseignants avec `gender`.
- 37 élèves (4 nouvelles familles Belkacem + Lasri pour peupler les classes ajoutées), 52 parents, 74 liaisons parent-élève.
- 148 enregistrements d'appel (4 semaines glissantes).
- 37 appréciations T1 avec `generalComment` adapté à la moyenne, `subjectComments` par matière principale, `autoMention` calculée, et **13 décisions conseil** pour les 3 classes avec évaluations verrouillées + observations correspondantes.

### Modifié

#### Sidebar
- **1ère position** : "Année scolaire" (CalendarDays) — nouvelle en-tête
- **2e position** : "Emploi du temps" (Calendar) — déplacé après Tableau de bord
- Après Élèves : "Enseignants" (UserCheck)
- Après Bulletins : "Conseil de classe" (Users), "Livret scolaire" (BookOpen), "Passage de classe" (ArrowUpCircle)
- Après Évaluations : "Notes & Moyennes" (BarChart3), "Appréciations" (MessageSquareText), "Mentions" (Award), "Bulletins" (FileText)

#### Header admin
- Ajout du `YearSwitcher` à gauche (desktop) et à droite (mobile).
- Ajout du `ArchiveBanner` entre le header et le `main` (via `admin-shell.tsx`).

#### Page Classes
- Le nom du professeur dans la colonne "Professeur" est désormais un `<Link>` cliquable vers `/admin/vie-scolaire/enseignants/[id]`.

### Correctifs

#### Fix dropdowns UUID → noms (bug UX majeur)
Diagnostic : Base UI `<Select.Value>` (v1.4) n'utilise PAS automatiquement le texte des `<Select.Item>` pour afficher le libellé de la sélection courante. Il appelle `resolveSelectedLabel(value, items, itemToStringLabel)`. Sans `items` sur `<Select.Root>`, fallback vers `stringifyAsLabel(value)` → renvoie l'UUID brut.

Fix : passé `items={toSelectItems(list, valueKey, labelKey)}` sur chaque `<Select>` avec options dynamiques (~50 dropdowns). Helper centralisé dans `src/components/ui/select.tsx`. 23 fichiers modifiés : `grades-summary-view`, `grades-summary-student-view`, `appreciations-view`, `mentions-view`, `bulletins-view`, `council-view`, `transitions-view`, `attendance-selector`, `attendance-filters`, `evaluation-filters`, `evaluation-form`, `student-filters`, `student-form`, `parent-filters`, `parent-form`, `class-filters`, `class-form`, `subject-form`, `homework-filters`, `homework-form`, `course-content-filters`, `course-content-form`, `teacher-filters`, `teacher-form`.

#### Fix positionnement Select (saut à la sélection)
Diagnostic : Base UI défaut `alignItemWithTrigger=true` repositionne verticalement le popup pour que l'item sélectionné reste aligné avec le trigger — d'où le "saut" quand on clique un item en bas de liste.

Fix appliqué UNE SEULE FOIS dans `src/components/ui/select.tsx` :
- Défaut `alignItemWithTrigger=false` (équivalent de `position="popper"` côté Radix)
- `max-h-60 overflow-y-auto` (remplace `max-h-(--available-height)`) — 240px max, scroll si plus long
- `sideOffset=4` déjà le défaut, conservé
- `align="start"` (était `"center"`) pour un alignement horizontal plus naturel

Aucun changement dans les ~50 call sites.

### Décisions techniques

1. **`isCurrent` dénormalisé** : gardé en sync avec `status==='ACTIVE'` par les server actions. Évite un refactor de toutes les queries existantes `{ isCurrent: true }`.
2. **Client vs server dans `academic-year.ts`** : séparation stricte après erreur de build "Can't resolve 'tls'" — `src/lib/academic-year.ts` ne contient que des constantes client-safe, `src/server/actions/academic-years.ts` contient les helpers Prisma.
3. **Multi-classes par créneau** : pas de changement de schéma (le modèle `Schedule` autorisait déjà plusieurs classes sur le même `timeSlot` via `classGroupId` différent). Tout se joue côté agrégation dans `getTimetableData`.
4. **Pré-remplissage intelligent non intrusif** : les flags `userTouched*` préservent les modifications manuelles tout en gardant le flow "je tape la startDate → tout se remplit" pour la création.
5. **Helper `toSelectItems` plutôt que changer le wrapper SelectValue** : garde le code shadcn minimal, utilise l'API officielle Base UI (`items` prop sur `Select.Root`).

### Build & Migration
- 4 nouvelles migrations Prisma appliquées (`add-appreciations-mentions`, `add-teacher-fields`, `add-council-fields`, `add-academic-year-status`).
- `npx prisma generate` + `npx prisma db seed` rejoués avec succès.
- `npm run build` : `✓ Compiled successfully in 3.4s`, `Finished TypeScript in 5.9s`, 25 routes, 0 erreur.

### Reporté / bloqué
- Enforcement `assertYearNotClosed` dans les Server Actions existantes (grades, evaluations, attendance) : helper écrit mais pas encore câblé — pas urgent tant qu'aucune année n'est CLOTUREE.
- Dropdown `YearSwitcher` fonctionnellement passif : pour v0.1 l'app utilise toujours l'année ACTIVE. Le changement de contexte via `?year=...` est visuel (bandeau archives) mais les queries restent sur l'année active.
- **Prochaines itérations identifiées** : Espace Professeur (dashboard filtré + appel + notes + contenu + devoirs), Import CSV élèves/parents, Espace Parents (portail), page Paramètres (configuration école), Gestion utilisateurs admin (CRUD admin/directeur/personnel), Déploiement Vercel + Neon.

---

## [0.1.0-dev] — 2026-04-17 (après-midi)

Architecture modulaire, hiérarchie matières, module Évaluations & Notes.

### Ajouté

#### Page d'entrée modules
- **`/admin/modules`** — nouvelle page post-login avec 4 cartes de modules :
  - **Vie Scolaire** (active) — description : élèves, classes, appel, devoirs, évaluations
  - **Planning** (Bientôt) — emplois du temps, créneaux
  - **Communication** (Bientôt) — messagerie, notifications
  - **Facturation** (Bientôt) — frais, paiements
- `/admin` redirige désormais vers `/admin/modules`
- Post-login : redirection vers `/admin/modules` (au lieu de `/admin`)

#### Refactor routing — toutes les pages Vie Scolaire sous `/admin/vie-scolaire/*`
- `/admin/eleves` → `/admin/vie-scolaire/eleves` (et `/[id]`)
- `/admin/parents` → `/admin/vie-scolaire/parents` (et `/[id]`)
- `/admin/classes`, `/admin/niveaux`, `/admin/matieres`
- `/admin/contenu-cours`, `/admin/devoirs`, `/admin/appel`
- Dashboard Vie Scolaire : `/admin/vie-scolaire`
- Sidebar déplacée dans le layout `/admin/vie-scolaire` (plus dans `/admin` racine)
- Lien **"Retour aux modules"** en haut de sidebar pour revenir à `/admin/modules`
- Tous les liens internes, redirections et `revalidatePath` mis à jour

#### Hiérarchie matières (parent / enfant)
- **Modèle Prisma** : `Subject.parentId String?` self-référentiel, relation `SubjectHierarchy` avec `onDelete: Cascade` (supprimer un parent supprime tous ses enfants)
- **Validator** : `subjectSchema.parentId: z.string().optional().nullable()`
- **Server Actions** :
  - `getSubjects` avec `_count` children/courseContents/homeworks
  - `getParentSubjects` (uniquement les matières de niveau 0 pour dropdowns)
  - `createSubject` rejette le nesting à 3 niveaux
  - `updateSubject` garde contre self-reference et hiérarchie imbriquée
  - `deleteSubject` bloque si usage total (enfants inclus) > 0
- **UI** :
  - `subject-list.tsx` : arbre accordéon (ChevronDown/Right), recherche auto-expand, bouton **"+"** par parent pour ajouter un enfant
  - `subject-form.tsx` : dropdown "Parent" (matières de niveau 0 uniquement, exclue la matière elle-même), `defaultParentId` supporté pour flow "add sub-subject"
  - `subject-delete-dialog.tsx` : avertissement cascade quand `childrenCount > 0`
- **Seed — 17 matières** :
  - Général
  - Langue arabe + 7 enfants (Expression orale, Expression écrite, Lecture, Vocabulaire, Grammaire, Conjugaison, Dictée)
  - Comportement
  - Éducation musulmane + 4 enfants (Sira, Hadith, Fiqh, Aqida)
  - Coran + 1 enfant (Lecture et mémorisation)

#### Module Évaluations & Notes
- **Modèles Prisma** :
  - `Evaluation` : `id`, `schoolId`, `classGroupId`, `teacherId`, `subjectId`, `subSubjectId?`, `label`, `mode` (INDIVIDUAL/GROUP), `evaluationType` (CONTROLE/EXAMEN), `date`, `coefficient` (défaut 2), `scale` (défaut 10), `isLocked`
  - `Grade` : `id`, `evaluationId`, `studentId`, `score: Float?`, `isAbsent: Boolean`, unique composite `(evaluationId, studentId)`
  - Enums : `EvaluationMode`, `EvaluationType`
- **Migration** `20260417134339_add_subject_hierarchy_evaluations_grades` appliquée
- **Validators** :
  - `evaluationSchema` : label 3-200, mode, groupType?, studentId? (requis si INDIVIDUAL via refine), classGroupId, teacherId, subjectId, subSubjectId?, evaluationType, date, coefficient 0.1-10, scale 1-100
  - `gradeEntrySchema` : studentId, score?, isAbsent (refine : score ou isAbsent requis)
  - `gradesPayloadSchema` : evaluationId, grades[], lock
- **Server Actions** :
  - `evaluations.ts` : `getEvaluations`, `getEvaluationById`, `getEvaluationOptions`, `createEvaluation`, `updateEvaluation`, `deleteEvaluation` (bloquée si verrouillée)
  - `grades.ts` : `saveGrades` avec `prisma.$transaction` (upsert + optional lock), validation student-in-class + score range + lock-requires-complete
- **Page liste** `/admin/vie-scolaire/evaluations` :
  - Composant `evaluation-list.tsx` : table avec label, classe, matière (+ sous-matière), prof, type, coefficient, barème, date, badge statut (amber = verrouillé / emerald = ouvert), DropdownMenu actions
  - Composant `evaluation-filters.tsx` : 5 filtres Select (classe, matière, enseignant, type, statut) + recherche libellé, sentinelles `__all__` pour "tous"
  - Pagination 10/page
  - Composant `evaluation-form.tsx` : **coefficient auto** via `useEffect` (CONTROLE → 2, EXAMEN → 1, uniquement en création), **teacher auto-rempli** depuis `class.mainTeacherId` au changement de classe, **sous-matière filtrée** selon `subjectId` sélectionné (reset si parent change)
  - Composant `evaluation-delete-dialog.tsx` : mentionne le nombre de notes à supprimer
  - Composant `evaluation-exports.tsx` : CSV (papaparse), Excel (xlsx), PDF (jspdf + autoTable), Imprimer
  - Lien du label de la ligne → page de saisie des notes
- **Page saisie notes** `/admin/vie-scolaire/evaluations/[id]/notes` :
  - Composant `grade-entry.tsx` : table élèves (matricule + nom), input numérique (`step 0.25`, min 0, max = scale), checkbox absent
  - Composant `grade-stats.tsx` : 5 stats live (Moyenne /scale, Max, Min, Noté/total, Absent + "X restant")
  - Boutons **"Enregistrer brouillon"** (permissif, validation partielle) + **"Valider et verrouiller"** (requiert note OU absent pour CHAQUE élève, AlertDialog de confirmation, action irréversible)
  - Si `evaluation.isLocked` : badge "Verrouillé", inputs/checkboxes disabled, boutons de save masqués
  - Export CSV local (papaparse + BOM UTF-8)
- **Sidebar** : entrée **"Évaluations"** (icône `FileCheck`) insérée entre Appel et Niveaux

#### Seed — évaluations & notes
- **5 évaluations** sur 2 classes (ENF-G, ENF-F) et matières seedées :
  - 3 verrouillées avec notes réalistes (scores 3-10/10 arrondis au 0.5, ~10-15 % absents)
  - 2 ouvertes sans notes
- Fonction `createEvaluations` dans le seed : génération des grades via `gradesRange` + seed deterministic par `evaluationId`
- Suppression à rejouer : `Grade.deleteMany` + `Evaluation.deleteMany` + 2-pass subject delete (enfants d'abord)

### Modifié

#### Auth & redirection
- `src/app/login/page.tsx` : redirection post-login vers `/admin/modules`
- Middleware : toutes les routes `/admin/**` protégées (inchangé), mais toute la navigation module passe par `/admin/modules`

#### Sidebar module
- `src/components/admin/admin-sidebar.tsx` :
  - Ajout import `FileCheck`
  - NAV_ITEM `"Évaluations"` inséré après `"Appel"`, avant `"Niveaux"`
  - Tous les `href` pointent vers `/admin/vie-scolaire/*`
  - Bouton "Retour aux modules" en haut

#### Layouts
- `src/app/admin/vie-scolaire/layout.tsx` (nouveau) : contient la sidebar Vie Scolaire
- `src/app/admin/modules/page.tsx` (nouveau) : sélecteur 4 cartes
- `src/app/admin/page.tsx` : `redirect('/admin/modules')`

### Décisions techniques

1. **Architecture modulaire** — chaque module a sa propre sous-route + sa propre sidebar, la page `/admin/modules` sert de hub. Permet d'ajouter Planning / Communication / Facturation sans toucher Vie Scolaire.
2. **Hiérarchie 2 niveaux max** — `parent.parentId !== null` rejeté à la création. Pas de petits-enfants (simplifie l'UI arbre).
3. **Cascade delete côté DB** — `onDelete: Cascade` sur `Subject.parentId` évite les vérifications applicatives complexes. Blocage seulement si usages (cours, devoirs, évaluations) sur le parent ou ses enfants.
4. **Coefficient auto dans le form d'évaluation** — règle métier commune (CONTROLE compte double), reste modifiable.
5. **Verrouillage irréversible** — conforme aux pratiques scolaires (une note publiée ne se modifie plus sans acte administratif). Modal confirm + lock condition (tous notés ou absents).
6. **Sous-matière optionnelle** — permet d'évaluer sur "Langue arabe" ou sur "Langue arabe › Dictée", au choix du prof.
7. **Mode INDIVIDUAL reporté côté UI** — le modèle est prêt (champ `studentId` optionnel, refine conditionnel), mais le formulaire n'expose que le mode GROUP en v0.1.

### Reporté / bloqué

- **Mode INDIVIDUAL** dans le formulaire Évaluations (5.5.2.7)
- **Bulletins & conseil de classe** (5.5.4.x) — nouveau périmètre ajouté au backlog (7 tâches)
- Reports existants (Supabase Storage, invitation parents, etc.) inchangés

### Build & Migration

- `npx prisma generate` lancé pour régénérer le client avec les nouveaux modèles
- `npx prisma migrate deploy` : migration `20260417134339_add_subject_hierarchy_evaluations_grades` appliquée
- `npm run build` passe sans erreur TypeScript
- Seed rejoué : 17 subjects, 5 evaluations, 17 grades

### Correctifs

- **Runtime error "Cannot read properties of undefined (reading 'findMany')"** sur `src/server/actions/evaluations.ts` : diagnostiqué comme cache du client Prisma (dev server démarré avant la migration). Résolu par `npx prisma generate` + redémarrage du dev server. Build prod vérifié sur port 3001 (HTTP 200 sur `/admin/vie-scolaire/evaluations`).
- **TS error** sur `AlertDialogDescription asChild` : propriété non supportée, paragraphe d'avertissement extrait de la description.

---

## [0.1.0-dev] — 2026-04-16 / 2026-04-17 (matin)

Session de développement couvrant les phases 3, 4 et 5 du module Vie scolaire.

### Ajouté

#### Pages admin livrées
- **`/admin`** — Dashboard : 4 KPIs (élèves, classes, enseignants, absences du mois), planning hebdomadaire des 5 créneaux, prochains cours avec bouton d'appel, alertes absences (élèves ≥ 4), activité récente (5 derniers contenus + devoirs)
- **`/admin/eleves`** et **`/admin/eleves/[id]`** — Liste + fiche élève avec onglets (infos, parents, scolarité, absences), exports CSV/Excel/PDF, filtres (niveau, classe, statut, genre), recherche
- **`/admin/parents`** et **`/admin/parents/[id]`** — Liste + fiche parent avec enfants liés, statut d'invitation, ajout frère/sœur depuis fiche élève
- **`/admin/classes`** — CRUD classes avec genre (FILLE/GARCON/MIXTE), prof attitré (`mainTeacherId`), créneau unique par classe
- **`/admin/niveaux`** — CRUD niveaux libres avec agrégations (classes, inscrits, capacité, taux de remplissage)
- **`/admin/matieres`** — CRUD matières libres
- **`/admin/contenu-cours`** — Journal de cours (titre ≥ 5 car, contenu ≥ 20 car, objectifs, remarques, date non future, warning si jour ≠ TimeSlot), filtres classe/prof/date, pagination 10/page
- **`/admin/devoirs`** — Devoirs (titre, description ≥ 20 car, consignes, échéance ≥ date création, statut auto À venir / Aujourd'hui / En retard), pagination 10/page
- **`/admin/appel`** — Page dédiée : sélecteur classe+date, pastilles hebdomadaires (Appel fait / Non fait / À venir / Libre), historique paginé 15/page avec filtres serveur (classe, statut, période, recherche élève), détail en modale, export CSV avec BOM UTF-8, statistiques (4 KPIs taux présence, top 5 absences avec lien fiche élève + badge ≥ 4, résumé par classe avec barres colorées)

#### Composants réutilisables
- `attendance-modal.tsx` : modale d'appel P/A/R avec champ `lateMinutes`, pré-remplissage si appel existant, retard > 15 min → ABSENT automatique
- `attendance-selector.tsx`, `attendance-weekly-status.tsx`, `attendance-history.tsx`, `attendance-filters.tsx`, `attendance-detail-modal.tsx`, `attendance-export.tsx`, `attendance-stats.tsx`
- Dashboard : `dashboard-kpis.tsx`, `weekly-planning.tsx`, `upcoming-courses.tsx`, `absence-alerts.tsx` (animation pulse), `recent-activity.tsx`, `class-gender-badge.tsx`, `attendance-trigger-button.tsx`
- shadcn/ui ajoutés : `alert-dialog`, `avatar`, `badge`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `select`, `separator`, `sheet`, `table`

#### Server Actions
- `src/server/actions/attendance.ts` : `getClassesForAttendance`, `getClassForAttendance`, `getAttendanceByClassAndDate`, `saveAttendance`, `getAttendanceHistory`, `getAttendanceDetail`, `getWeeklyAttendanceStatus`, `getAttendanceStats`, `getAttendanceExport`
- `src/server/actions/dashboard.ts` : `getDashboardData` avec `groupBy` + `having` Prisma pour alertes absences ≥ 4
- `src/server/actions/course-contents.ts` et `homeworks.ts` : CRUD + filtres + select classes

#### Validators Zod
- `src/lib/validators/attendance.ts` : `attendanceEntrySchema` (studentId, status, lateMinutes 0-240, reason max 500 car) + refine RETARD implique lateMinutes ≥ 1
- `src/lib/validators/course-content.ts` : title ≥ 5, content ≥ 20, date non future
- `src/lib/validators/homework.ts` : title ≥ 5, description ≥ 20, refine dueDate ≥ createdDate

#### Sidebar
- Entrée "Appel" (icône `ClipboardCheck`) insérée entre "Devoirs" et "Niveaux"
- Navigation complète : Tableau de bord, Élèves, Parents / Familles, Contenu de cours, Devoirs, Appel, Niveaux, Classes, Matières

### Modifié

#### Modèle de données
- **`ClassGroup`** : ajout de `mainTeacherId` (FK optionnelle vers `Teacher`) — **1 classe = 1 prof attitré** qui enseigne toutes les matières
- **`Schedule`** simplifié : suppression de `subjectId` et `teacherId`. Ne contient plus que `classGroupId + timeSlot + startTime + endTime + room`. Une classe a un seul `Schedule`
- **`CourseContent`** : `subjectId` rendu nullable, ajout de `title`, `objectives`, `remarks`, index `(schoolId, classGroupId, date)`
- **`Homework`** : `subjectId` rendu nullable, ajout de `title`, `instructions`, index `(schoolId, classGroupId, dueDate)`
- Migration `20260416200000_add_course_content_homework_fields` appliquée

#### Règles métier
- **Retard > 15 minutes → ABSENT** automatique à la sauvegarde (constante `LATE_TO_ABSENT_MINUTES = 15`)
- **Alerte absences ≥ 4** affichée sur le dashboard (constante `ABSENCE_ALERT_THRESHOLD = 4`)
- Prof auto-rempli dans les formulaires Contenu/Devoirs depuis `class.mainTeacher` — plus de dropdown prof
- Upsert d'appel sur clé composée `(scheduleId, studentId, date)` → modification possible
- `halfDay` = `schedule.timeSlot` calculé automatiquement

### Décisions techniques

1. **1 classe = 1 prof pour toute l'année** — la table `TeacherSubject` existe mais n'est plus utilisée (candidate au nettoyage)
2. **Schedule unique par classe** — simplifie la sélection de créneau, un prof ne peut pas être sur 2 classes au même `TimeSlot`
3. **Subject optionnel** sur CourseContent et Homework — les écoles coraniques enchaînent plusieurs disciplines dans un même créneau
4. **Prof dérivé, pas saisi** — `mainTeacherId` sur ClassGroup est la source de vérité
5. **Historique appel groupé côté serveur** — clé `classGroupId|date|scheduleId`, agrégations P/A/R calculées dans Prisma
6. **Pastilles semaine** calculées pour la semaine courante (lundi → dimanche) via `mondayOfWeek` + `slotDateInWeek`

### Reporté / bloqué

- **Supabase Storage** : clients configurés (`src/lib/supabase.ts`) mais buckets non créés → upload photo élève (3.1.12) et pièces jointes devoirs (4.2.5) en attente
- **Invitation parent par email** : création parent crée un `User` sans email (pas de service SMTP configuré) → workflow token + lien MDP (1.4.6) et renvoi d'invitation (3.2.6) en attente
- **Auth prof** : les profs n'ont pas encore d'espace dédié — nouveau périmètre 5.3 ajouté au backlog (5.3.1–5.3.3)
- **Restriction modification 7 jours** côté prof (4.1.5) — admin peut toujours modifier
- **Calcul strict demi-journées** (5.1.6) — actuellement comptage simple par entrée, pas "absent à tous les créneaux"
- **Tests unitaires** (6.6) — aucun test écrit en v0.1
- **Déploiement production** (6.7, 6.8) — Vercel + Neon à configurer

### Build

- `npm run build` passe sans erreur TypeScript
- Next.js 16.2.4 (Turbopack)
- Routes dynamiques : toutes les pages `/admin/*` + `/`

---
