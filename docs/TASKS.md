# Backlog de tâches — EcoleGestion v0.1

## Légende

- **Statut** : `[ ]` À faire | `[~]` En cours | `[x]` Terminé | `[!]` Bloqué
- **Priorité** : P0 (critique) | P1 (important) | P2 (souhaitable)
- **Complexité** : S (small, < 2h) | M (medium, 2-4h) | L (large, 4-8h) | XL (extra large, > 8h)

---

## Phase 1 — Fondations

### 1.1 Setup projet
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 1.1.1 | Init Next.js 15 + TypeScript | P0 | S | [x] | — |
| 1.1.2 | Configurer Tailwind CSS | P0 | S | [x] | 1.1.1 |
| 1.1.3 | Installer et configurer shadcn/ui | P0 | S | [x] | 1.1.2 |
| 1.1.4 | Configurer ESLint + Prettier | P0 | S | [x] | 1.1.1 |
| 1.1.5 | Créer le fichier .env.example (Neon, Auth.js, Supabase, SMTP) | P0 | S | [x] | 1.1.1 |

### 1.2 Base de données
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 1.2.1 | Installer Prisma + configurer PostgreSQL | P0 | S | [x] | 1.1.1 |
| 1.2.2 | Écrire le schéma Prisma complet (enums TimeSlot, ClassGender, etc.) | P0 | L | [x] | 1.2.1 |
| 1.2.3 | Exécuter la migration initiale | P0 | S | [x] | 1.2.2 |
| 1.2.4 | Écrire le seed (école coranique, users, niveaux libres, classes non mixtes, élèves, parents, matières coraniques) | P0 | L | [x] | 1.2.3 |
| 1.2.5 | Créer le client Prisma singleton (lib/prisma.ts) | P0 | S | [x] | 1.2.1 |
| 1.2.6 | Configurer les 5 créneaux horaires autorisés (constantes TimeSlot + helpers de validation jour/créneau) | P0 | M | [x] | 1.2.2 |

### 1.3 Stockage fichiers
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 1.3.1 | Setup Supabase Storage + créer les 3 buckets (photos-eleves, pieces-jointes-devoirs, documents-administratifs) | P0 | M | [ ] | 1.1.5 |
| 1.3.2 | Créer les helpers upload/download/delete pour Supabase Storage | P0 | M | [ ] | 1.3.1 |
| 1.3.3 | Configurer les policies d'accès Supabase (lecture authentifiée) | P1 | S | [ ] | 1.3.1 |

### 1.4 Authentification
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 1.4.1 | Configurer Auth.js v5 (credentials provider) | P0 | M | [x] | 1.2.4 |
| 1.4.2 | Créer la page de login | P0 | M | [x] | 1.4.1 |
| 1.4.3 | Middleware de protection des routes | P0 | M | [x] | 1.4.1 |
| 1.4.4 | Helper getSession avec rôle et schoolId | P0 | S | [x] | 1.4.1 |
| 1.4.5 | Redirection post-login selon le rôle | P1 | S | [x] | 1.4.4 |
| 1.4.6 | Workflow invitation parent (génération token, envoi email, page de définition MDP) | P0 | L | [ ] | 1.4.1 |

### 1.5 Layout admin
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 1.5.1 | Layout principal (dashboard) avec sidebar | P0 | L | [x] | 1.4.3 |
| 1.5.2 | Header avec user info et logout | P0 | M | [x] | 1.5.1 |
| 1.5.3 | Sidebar avec navigation modules/onglets | P0 | M | [x] | 1.5.1 |
| 1.5.4 | Composant Breadcrumb | P1 | S | [ ] | 1.5.1 |
| 1.5.5 | Tabs de navigation du module Vie scolaire | P0 | M | [x] | 1.5.1 |

### 1.6 Composants partagés
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 1.6.1 | Composant DataTable générique (tri, filtre, pagination) | P0 | XL | [~] | 1.1.3 |
| 1.6.2 | Composant ExportButtons (CSV, Excel, PDF) | P1 | L | [x] | 1.6.1 |
| 1.6.3 | Composant SearchBar | P0 | S | [x] | 1.1.3 |
| 1.6.4 | Composant StatCard (KPI) | P1 | S | [x] | 1.1.3 |
| 1.6.5 | Composant ConfirmDialog | P0 | S | [x] | 1.1.3 |
| 1.6.6 | Composant EmptyState | P2 | S | [x] | 1.1.3 |
| 1.6.7 | Composant PageHeader | P0 | S | [x] | 1.1.3 |
| 1.6.8 | Composant FormModal | P0 | M | [~] | 1.1.3 |
| 1.6.9 | Composant PlaceholderToast ("Messagerie bientôt disponible") | P1 | S | [x] | 1.1.3 |

---

## Phase 2 — Entités de configuration

### 2.1 Niveaux
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 2.1.1 | Page liste des niveaux (libellés libres) | P0 | M | [x] | 1.6.1 |
| 2.1.2 | Modale création/édition niveau (texte libre, pas de niveaux standards) | P0 | M | [x] | 1.6.8 |
| 2.1.3 | Server Actions CRUD niveau | P0 | M | [x] | 1.2.5 |
| 2.1.4 | Validation Zod niveau | P0 | S | [x] | — |
| 2.1.5 | Calcul agrégations (places, inscrits, taux) | P0 | M | [x] | 2.1.3 |
| 2.1.6 | Protection suppression (si classes liées) | P0 | S | [x] | 2.1.3 |

### 2.2 Classes
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 2.2.1 | Page liste des classes (avec badge genre : Filles/Garçons/Mixte) | P0 | M | [x] | 1.6.1, 2.1.1 |
| 2.2.2 | Modale création/édition classe (genre FILLE/GARCON/MIXTE, défaut GARCON, période défaut TRIMESTRE) | P0 | L | [x] | 1.6.8, 2.1.3 |
| 2.2.3 | Server Actions CRUD classe | P0 | M | [x] | 1.2.5 |
| 2.2.4 | Validation Zod classe | P0 | S | [x] | — |
| 2.2.5 | Sélection niveau → filtre cascade | P0 | M | [x] | 2.1.3 |
| 2.2.6 | Validation genre élève vs genre classe à l'inscription | P0 | M | [x] | 2.2.3 |
| 2.2.7 | Protection suppression (si élèves liés) | P0 | S | [x] | 2.2.3 |

### 2.3 Matières
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 2.3.1 | Page liste des matières (libellés libres, exemples coraniques) | P0 | M | [x] | 1.6.1 |
| 2.3.2 | Modale création/édition matière (texte libre) | P0 | M | [x] | 1.6.8 |
| 2.3.3 | Server Actions CRUD matière | P0 | M | [x] | 1.2.5 |
| 2.3.4 | Validation Zod matière (heures max 15h/semaine) | P0 | S | [x] | — |
| 2.3.5 | Calcul écart heures planifiées | P1 | M | [ ] | 2.3.3 |
| 2.3.6 | Protection suppression (si cours/devoirs liés) | P0 | S | [x] | 2.3.3 |
| 2.3.7 | Hiérarchie matières parent/enfant (Subject.parentId self-ref, arbre accordéon, cascade delete) | P1 | L | [x] | 2.3.3 |

---

## Phase 3 — Élèves, enseignants et parents

### 3.1 Élèves
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 3.1.1 | Page liste des élèves (table + recherche + filtres) | P0 | L | [x] | 1.6.1, 2.2.1 |
| 3.1.2 | Page création élève (formulaire complet, filtrage classes par genre) | P0 | L | [x] | 2.1.3, 2.2.3 |
| 3.1.3 | Génération automatique matricule | P0 | M | [x] | 1.2.5 |
| 3.1.4 | Validation Zod élève | P0 | M | [x] | — |
| 3.1.5 | Page fiche élève (lecture, onglets) | P0 | L | [x] | 3.1.1 |
| 3.1.6 | Page édition élève | P0 | M | [x] | 3.1.2 |
| 3.1.7 | Contrôle capacité classe à l'inscription | P0 | M | [x] | 3.1.2 |
| 3.1.8 | Contrôle genre élève vs genre classe | P0 | S | [x] | 3.1.2 |
| 3.1.9 | Section parents dans la fiche élève | P0 | M | [x] | 3.2.1 |
| 3.1.10 | Exports CSV/Excel/PDF/Print de la liste élèves | P1 | M | [x] | 1.6.2 |
| 3.1.11 | Boutons Contacter / Contacter parents → toast placeholder | P1 | S | [x] | 1.6.9 |
| 3.1.12 | Upload photo élève via Supabase Storage | P1 | M | [ ] | 1.3.2 |

### 3.1.bis Enseignants (ajouté 2026-04-23)
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 3.1.bis.1 | Migration `20260423133354_add_teacher_fields` (gender, address, dateOfBirth sur Teacher) | P1 | S | [x] | 1.2.2 |
| 3.1.bis.2 | Validator Zod `src/lib/validators/teacher.ts` | P1 | S | [x] | — |
| 3.1.bis.3 | Server Actions CRUD enseignants (getTeachers, getTeacherById, createTeacher+User, updateTeacher, deleteTeacher protégée) | P1 | M | [x] | 1.2.5 |
| 3.1.bis.4 | Page `/admin/vie-scolaire/enseignants` : liste paginée (15/page), filtre statut, recherche nom/prénom, badges classes assignées, exports CSV/Excel/PDF/Imprimer | P1 | L | [x] | 1.6.1 |
| 3.1.bis.5 | Formulaire création/modification (genre radio, nom/prénom/email/téléphone requis, adresse/dob optionnels, spécialité indicative, statut) | P1 | M | [x] | 3.1.bis.2 |
| 3.1.bis.6 | Création enseignant = User PROFESSEUR + mot de passe temporaire hashé (ChangeMe2026!) en transaction | P1 | S | [x] | 1.4.1 |
| 3.1.bis.7 | Email unique vérifié + désactivation bloquée si classes assignées | P1 | S | [x] | 3.1.bis.3 |
| 3.1.bis.8 | Suppression bloquée si mainTeacherId sur une classe, supprime User + TeacherSubject sinon | P1 | S | [x] | 3.1.bis.3 |
| 3.1.bis.9 | Fiche enseignant `/[id]` : infos personnelles, classes assignées, emploi du temps (5 créneaux, Libre si vide), stats (élèves, évaluations, taux présence) | P1 | L | [x] | 3.1.bis.3 |
| 3.1.bis.10 | Sidebar : lien "Enseignants" (icône UserCheck) après Élèves | P1 | S | [x] | 3.1.bis.4 |
| 3.1.bis.11 | Navigation croisée : prof cliquable depuis page Classes → fiche enseignant, classes cliquables depuis fiche prof | P1 | S | [x] | 3.1.bis.9 |

### 3.2 Parents
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 3.2.1 | Page liste des parents (table + recherche + colonne statut invitation) | P0 | L | [x] | 1.6.1 |
| 3.2.2 | Page création parent (formulaire + création User + envoi email invitation) | P0 | L | [~] | 1.2.5, 1.4.6 |
| 3.2.3 | Validation Zod parent | P0 | M | [x] | — |
| 3.2.4 | Liaison parent-élève (dans formulaire parent et élève) | P0 | L | [x] | 3.1.1, 3.2.1 |
| 3.2.5 | Page fiche parent (avec liste enfants + statut invitation) | P0 | M | [x] | 3.2.1 |
| 3.2.6 | Bouton "Renvoyer l'invitation" (si compte non activé) | P1 | S | [ ] | 3.2.2 |
| 3.2.7 | Ajout frère/sœur depuis fiche élève | P1 | M | [x] | 3.2.4 |
| 3.2.8 | Exports CSV/Excel/PDF de la liste parents | P1 | M | [ ] | 1.6.2 |
| 3.2.9 | Bouton Discussion → toast placeholder | P1 | S | [x] | 1.6.9 |

---

## Phase 4 — Contenu pédagogique

### 4.1 Contenu de cours
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 4.1.1 | Page contenu de cours (formulaire + liste) | P1 | L | [x] | 2.2.1, 2.3.1 |
| 4.1.2 | Server Actions CRUD contenu de cours | P1 | M | [x] | 1.2.5 |
| 4.1.3 | Validation Zod contenu de cours (warning si date hors créneau classe) | P1 | M | [x] | 1.2.6 |
| 4.1.4 | Filtrage par date/prof/classe | P1 | M | [x] | 4.1.1 |
| 4.1.5 | Restriction modification 7 jours (professeur) | P2 | S | [ ] | 4.1.2 |

### 4.2 Devoirs
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 4.2.1 | Page devoirs (formulaire + liste) | P1 | L | [x] | 2.2.1, 2.3.1 |
| 4.2.2 | Server Actions CRUD devoirs | P1 | M | [x] | 1.2.5 |
| 4.2.3 | Validation Zod devoirs (échéance ≥ création) | P1 | M | [x] | 1.2.6 |
| 4.2.4 | Calcul automatique statut (À venir/Aujourd'hui/En retard) | P1 | S | [x] | 4.2.2 |
| 4.2.5 | Upload pièce jointe via Supabase Storage | P1 | M | [ ] | 1.3.2 |

---

## Phase 5 — Appel et dashboard

### 5.1 Appel
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 5.1.1 | Modale d'appel (liste élèves, statuts radio, créneau TimeSlot) | P1 | L | [x] | 3.1.1 |
| 5.1.2 | Server Action enregistrement appel (validation créneau autorisé) | P1 | M | [x] | 1.2.6 |
| 5.1.3 | Bouton "Tous présents" | P1 | S | [x] | 5.1.1 |
| 5.1.4 | Calcul automatique halfDay = TimeSlot du créneau | P1 | S | [x] | 5.1.2 |
| 5.1.5 | Modification d'un appel existant | P1 | M | [x] | 5.1.2 |
| 5.1.6 | Calcul strict demi-journées d'absence (absent à TOUS les créneaux d'une demi-journée) | P1 | L | [~] | 5.1.4 |
| 5.1.7 | Page dédiée /admin/appel (sélecteur, pastilles semaine, historique paginé filtré, détail, export CSV) | P1 | L | [x] | 5.1.1 |
| 5.1.8 | Statistiques d'appel (KPIs, top 5 absences, résumé par classe) | P1 | M | [x] | 5.1.7 |

### 5.1.bis Emploi du temps visuel (ajouté 2026-04-23)
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 5.1.bis.1 | Server action `timetable.ts` : agrégation schedules + classes + profs + salles + nb élèves + statut appel de la semaine | P1 | M | [x] | 1.2.5 |
| 5.1.bis.2 | Page `/admin/vie-scolaire/emploi-du-temps` : grille 3 colonnes (Mercredi/Samedi/Dimanche) × 2 lignes (Matin/Après-midi), Mercredi matin grisé | P1 | L | [x] | 5.1.bis.1 |
| 5.1.bis.3 | Cards colorées par genre (FILLE rose / GARCON bleu / MIXTE violet) avec nom classe, prof, salle, horaires, nb élèves, pastille appel | P1 | M | [x] | 5.1.bis.2 |
| 5.1.bis.4 | 3 vues : Toutes les classes · Par enseignant (autres cases "Disponible") · Par classe (highlight + autres grisées) | P1 | M | [x] | 5.1.bis.2 |
| 5.1.bis.5 | Navigation semaine (flèches < > + bouton "Aujourd'hui") avec rechargement serveur | P1 | M | [x] | 5.1.bis.1 |
| 5.1.bis.6 | Modale détail au clic : infos, dernier contenu, dernier devoir, actions (Appel, Classe, Contenu, Devoir, Fiche prof) | P1 | M | [x] | 5.1.bis.3 |
| 5.1.bis.7 | 4 mini-KPIs + tableau récap dépliable (créneaux occupés %, élèves planifiés, profs actifs, libres) | P1 | S | [x] | 5.1.bis.1 |
| 5.1.bis.8 | Exports CSV + PDF A4 paysage (grille visuelle + tableau récap) + impression via CSS `@page size: A4 landscape` | P1 | M | [x] | 5.1.bis.2 |
| 5.1.bis.9 | Responsive : grille → liste verticale empilée sur mobile | P1 | S | [x] | 5.1.bis.2 |
| 5.1.bis.10 | Sidebar : lien "Emploi du temps" (icône Calendar) en 2e position | P1 | S | [x] | 5.1.bis.2 |

### 5.1.ter Année scolaire (ajouté 2026-04-23)
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 5.1.ter.1 | Migration `20260423144311_add_academic_year_status` : enum `AcademicYearStatus` (BROUILLON/ACTIVE/CLOTUREE) + 6 champs trimestres + closedAt sur AcademicYear | P1 | S | [x] | 1.2.2 |
| 5.1.ter.2 | Validator Zod (label unique, T1<T2<T3, in bounds, no overlap) | P1 | S | [x] | — |
| 5.1.ter.3 | Server actions : getAcademicYears, createAcademicYear, updateAcademicYear, activateAcademicYear (ferme la précédente), closeAcademicYear, deleteAcademicYear (brouillon vide uniquement), listAcademicYearsForHeader, getClosureWarnings, getActiveAcademicYear, assertYearNotClosed | P1 | M | [x] | 1.2.5 |
| 5.1.ter.4 | Helper `src/lib/academic-year.ts` (constantes labels/couleurs client-safe) + `assertYearNotClosed` server-side dans le server action | P1 | S | [x] | — |
| 5.1.ter.5 | Page `/admin/vie-scolaire/annee-scolaire` : cards empilées avec bordure gauche colorée selon statut, badges trimestres, stats (élèves/classes/évals/appréciations) | P1 | L | [x] | 5.1.ter.3 |
| 5.1.ter.6 | Formulaire création/modification avec pré-remplissage intelligent (label auto "YYYY-YYYY+1", endDate=30/06, T1=01/09→20/12, T2=05/01→28/03, T3=06/04→30/06) | P1 | M | [x] | 5.1.ter.2 |
| 5.1.ter.7 | Modale activation : détecte conflit avec l'année ACTIVE existante, propose la double action "Clôturer X et activer Y" | P1 | M | [x] | 5.1.ter.3 |
| 5.1.ter.8 | Modale clôture : warning si passages non appliqués (pendingPassages + unappliedTransitions avec lien deeplink vers /passage) | P1 | M | [x] | 5.1.ter.3 |
| 5.1.ter.9 | Suppression brouillon uniquement + blocage si données liées (classes/appréciations/transitions) | P1 | S | [x] | 5.1.ter.3 |
| 5.1.ter.10 | Dropdown année dans l'admin-header (YearSwitcher) : ACTIVE en haut, archives clôturées en dessous, brouillons en bas, lien vers page de gestion | P1 | M | [x] | 5.1.ter.5 |
| 5.1.ter.11 | Bandeau jaune "Mode archives" (ArchiveBanner) quand `?year=...` pointe sur une année clôturée | P1 | S | [x] | 5.1.ter.10 |
| 5.1.ter.12 | Sidebar : lien "Année scolaire" (icône CalendarDays) en 1ère position | P1 | S | [x] | 5.1.ter.5 |
| 5.1.ter.13 | Seed mis à jour : année 2025-2026 ACTIVE avec dates trimestres réalistes (T1 01/09→20/12, T2 05/01→28/03, T3 06/04→30/06) | P1 | S | [x] | 5.1.ter.1 |

### 5.2 Dashboard
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 5.2.1 | KPIs : enseignants, élèves, classes, absences du mois | P1 | M | [x] | 1.6.4 |
| 5.2.2 | Planning de la semaine (5 créneaux TimeSlot) | P1 | L | [x] | 1.2.6 |
| 5.2.3 | Prochains cours avec bouton d'appel (logique mercredi/samedi/dimanche) | P1 | L | [x] | 5.1.1 |
| 5.2.4 | Activité récente (5 derniers contenus/devoirs) | P1 | M | [x] | 5.1.2 |
| 5.2.5 | Alertes : élèves ≥ 4 absences (seuil mensuel) | P1 | L | [x] | 5.1.6 |

### 5.3 Auth professeur (nouveau périmètre)
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 5.3.1 | Espace prof dédié (dashboard filtré sur ses classes) | P1 | L | [ ] | 1.4.1 |
| 5.3.2 | Restriction d'accès : prof ne voit que ses classes/élèves | P1 | M | [ ] | 5.3.1 |
| 5.3.3 | Appel autonome par le prof depuis son espace | P1 | M | [ ] | 5.1.1, 5.3.1 |

### 5.4 Architecture modulaire (ajouté 2026-04-17)
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 5.4.1 | Page `/admin/modules` (sélecteur 4 cartes, 1 active + 3 "Bientôt") | P0 | M | [x] | 1.5.1 |
| 5.4.2 | Déplacement de toutes les pages admin sous `/admin/vie-scolaire/*` | P0 | L | [x] | 5.4.1 |
| 5.4.3 | Sidebar dédiée au module Vie Scolaire + lien "Retour aux modules" | P0 | M | [x] | 5.4.2 |
| 5.4.4 | Redirection `/admin` → `/admin/modules` | P0 | S | [x] | 5.4.1 |

---

## Phase 5.5 — Évaluations et notes (ajouté 2026-04-17)

### 5.5.1 Modèle de données
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 5.5.1.1 | Modèle Prisma `Evaluation` (mode INDIVIDUAL/GROUP, type CONTROLE/EXAMEN, coefficient, scale, isLocked) | P1 | M | [x] | 1.2.2 |
| 5.5.1.2 | Modèle Prisma `Grade` (score Float?, isAbsent, unique evaluationId+studentId) | P1 | S | [x] | 5.5.1.1 |
| 5.5.1.3 | Migration `20260417134339_add_subject_hierarchy_evaluations_grades` | P1 | S | [x] | 5.5.1.2 |
| 5.5.1.4 | Seed : 5 évaluations (3 verrouillées avec notes réalistes, 2 ouvertes) | P1 | M | [x] | 5.5.1.2 |

### 5.5.2 Liste et CRUD évaluations
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 5.5.2.1 | Page `/admin/vie-scolaire/evaluations` (liste + filtres + pagination) | P1 | L | [x] | 5.5.1.2 |
| 5.5.2.2 | Filtres : libellé, classe, matière, enseignant, type, statut (ouvert/verrouillé) | P1 | M | [x] | 5.5.2.1 |
| 5.5.2.3 | Formulaire évaluation (coef auto 2/1 selon type, prof auto-rempli, sous-matière filtrée) | P1 | L | [x] | 5.5.2.1 |
| 5.5.2.4 | Server Actions CRUD évaluation (edit/delete bloqués si verrouillé) | P1 | M | [x] | 5.5.1.2 |
| 5.5.2.5 | Validation Zod évaluation + grade | P1 | M | [x] | — |
| 5.5.2.6 | Exports CSV/Excel/PDF/Imprimer liste évaluations | P1 | M | [x] | 5.5.2.1 |
| 5.5.2.7 | Mode INDIVIDUAL dans le formulaire (modèle prêt côté DB, actuellement GROUP-only) | P2 | M | [ ] | 5.5.2.3 |

### 5.5.3 Saisie des notes
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 5.5.3.1 | Page `/admin/vie-scolaire/evaluations/[id]/notes` (table élèves + input + absent) | P1 | L | [x] | 5.5.1.2 |
| 5.5.3.2 | Stats temps réel (moyenne, max, min, noté, absent, restant) | P1 | M | [x] | 5.5.3.1 |
| 5.5.3.3 | "Enregistrer brouillon" (permissif) + "Valider et verrouiller" (requiert note ou absent pour chaque élève) | P1 | M | [x] | 5.5.3.1 |
| 5.5.3.4 | Mode lecture seule si évaluation verrouillée | P1 | S | [x] | 5.5.3.1 |
| 5.5.3.5 | Modale de confirmation avant verrouillage (irréversible) | P1 | S | [x] | 5.5.3.3 |
| 5.5.3.6 | Export CSV local des notes | P1 | S | [x] | 5.5.3.1 |

### 5.5.4 Bulletins, appréciations, mentions, conseil, livret, passage
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 5.5.4.1 | Récapitulatif notes/moyennes par élève / classe / période (coefs + barèmes, codes couleur, rang, exports CSV/Excel/PDF/Imprimer, vues classe/élève) | P1 | L | [x] | 5.5.3.1 |
| 5.5.4.2 | Saisie appréciations (générale + par matière principale, suggestions rapides, sauvegarde par classe/trimestre) | P1 | L | [x] | 5.5.4.1 |
| 5.5.4.3 | Conseil de classe (tableau décisions 9 options, observation, résumé + PV PDF signatures directeur/prof) | P1 | XL | [x] | 5.5.4.2 |
| 5.5.4.4 | Impression bulletins trimestriels (aperçu web + PDF A4 individuel et classe, pied de page signature) | P1 | XL | [x] | 5.5.4.2 |
| 5.5.4.5 | Mentions (Excellent/TB/B/Passable/Insuffisant + override manuel, commentaire conseil) | P2 | M | [x] | 5.5.4.1 |
| 5.5.4.6 | Livret / cahier de vie (vue agrégée année × trimestres : moyennes, rang, mention, décision conseil, absences, appréciations + PDF A4 multi-pages) | P2 | L | [x] | 5.5.4.4 |
| 5.5.4.7 | Passage en classe supérieure (modèle ClassTransition + tableau décisions + bouton "Appliquer" irréversible avec vérifications capacité/genre) | P2 | L | [x] | 5.5.4.3 |

### 5.5.5 Modèle de données — Appréciations & mentions (ajouté 2026-04-23)
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 5.5.5.1 | Modèle Prisma `Appreciation` (generalComment, subjectComments Json, autoMention, manualMention, councilComment, unique studentId+classGroupId+period+academicYearId) | P1 | S | [x] | 1.2.2 |
| 5.5.5.2 | Migration `20260423131354_add_appreciations_mentions` | P1 | S | [x] | 5.5.5.1 |
| 5.5.5.3 | Seed : appréciations + mentions auto + décisions conseil pour tous les élèves (Trimestre 1) | P1 | M | [x] | 5.5.5.2 |
| 5.5.5.4 | Bibliothèque partagée `src/lib/bulletin.ts` (périodes, moyennes pondérées, rangs, mentions, suggestions) | P1 | M | [x] | — |
| 5.5.5.5 | Extension Appreciation : `councilDecision` + `councilObservation` (migration `20260423134648_add_council_fields`) | P1 | S | [x] | 5.5.5.1 |
| 5.5.5.6 | Nouveau modèle `ClassTransition` + enum `TransitionDecision` (PASSAGE/REDOUBLEMENT/DEPART/EN_ATTENTE), unique (studentId, academicYearId) | P1 | M | [x] | 1.2.2 |
| 5.5.5.7 | Validators Zod `council.ts` + `transition.ts` (9 décisions conseil + 4 décisions passage avec labels/couleurs) | P1 | S | [x] | — |

---

## Phase 6 — Polish et déploiement

| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 6.1 | Empty states sur tous les écrans | P2 | M | [~] | Toutes les pages |
| 6.2 | Loading skeletons | P2 | M | [~] | Toutes les pages |
| 6.3 | Error boundaries (error.tsx) | P1 | M | [ ] | 1.5.1 |
| 6.4 | Toast notifications | P1 | M | [x] | 1.1.3 |
| 6.5 | Responsive tables → cards mobile | P2 | L | [ ] | 1.6.1 |
| 6.6 | Tests unitaires règles métier (dont calcul strict demi-journées, validation créneaux) | P1 | L | [ ] | Phase 5 |
| 6.7 | Configuration Vercel + Neon production | P1 | M | [ ] | — |
| 6.8 | Script de migration production | P1 | M | [ ] | 6.7 |
| 6.9 | Revue de sécurité | P1 | M | [ ] | Phase 5 |

---

## Résumé par phase

| Phase | Tâches | P0 | P1 | P2 | Durée estimée |
|---|---|---|---|---|---|
| 1 - Fondations | 30 | 22 | 6 | 2 | 2 semaines |
| 2 - Configuration | 20 | 16 | 4 | 0 | 1 semaine |
| 3 - Élèves/Enseignants/Parents | 32 | 14 | 18 | 0 | 2 semaines |
| 4 - Pédagogie | 10 | 0 | 9 | 1 | 1 semaine |
| 5 - Appel/Dashboard/Modules/EDT | 28 | 4 | 24 | 0 | 2 semaines |
| 5.5 - Évaluations & bulletins | 27 | 0 | 23 | 4 | 3 semaines |
| 6 - Polish | 9 | 0 | 5 | 4 | 1 semaine |
| **Total** | **128** | **56** | **61** | **11** | **~12 semaines** |

---

## Bloqueurs résolus

| # | Ancien bloqueur | Résolution |
|---|---|---|
| B1 | Choix du provider Neon (gratuit vs payé) | Neon free tier pour v0.1, upgrade si nécessaire |
| B2 | Gestion des uploads (photos, pièces jointes) | **Supabase Storage** — 3 buckets configurés |
| B3 | Envoi d'emails (bienvenue, contact) | Service email à choisir (Resend recommandé) — nécessaire pour Phase 1 (invitation parents) |

---

## État global (mis à jour 2026-04-23)

**Module Vie Scolaire complet sur le périmètre v0.1.** 20 pages livrées, 25 routes, `npm run build` passe sans erreur.

### Pages en production (par ordre sidebar)
1. Année scolaire — cycle BROUILLON/ACTIVE/CLOTUREE + trimestres + pré-remplissage intelligent
2. Tableau de bord — KPIs + planning + alertes + activité
3. Emploi du temps — grille calendrier multi-classes + 3 vues + navigation semaine + PDF paysage
4. Élèves (+ fiche) — CRUD + filtres + exports + liaisons parents
5. Enseignants (+ fiche) — CRUD avec création User + Teacher + emploi du temps 5 créneaux + stats
6. Parents (+ fiche) — CRUD + liaisons élèves
7. Contenu de cours — CRUD + filtres
8. Devoirs — CRUD avec statut auto
9. Appel — modale + historique + stats + export
10. Évaluations (+ saisie notes) — CRUD + verrouillage + stats temps réel
11. Notes & Moyennes — récap classe/élève + rangs + exports
12. Appréciations — grille élève × matières + suggestions
13. Mentions — auto + override + commentaire conseil
14. Bulletins — readiness + aperçu + PDF A4
15. Conseil de classe — décisions + PV PDF
16. Livret scolaire — vue agrégée + PDF multi-pages
17. Passage de classe — décisions + application irréversible
18. Niveaux — CRUD + agrégations
19. Classes — CRUD + créneau + prof attitré
20. Matières — CRUD hiérarchique

---

## Prochaines itérations identifiées (post v0.1 fonctionnel)

### Priorités immédiates
1. **Espace Professeur** — dashboard filtré sur ses classes, appel autonome, saisie notes, création contenu de cours, création devoirs, restriction d'accès (le prof ne voit que ses propres classes/élèves). Touches : 5.3.1, 5.3.2, 5.3.3.
2. **Import CSV élèves/parents** — upload fichier + prévisualisation + mapping colonnes + validation ligne par ligne + création en masse avec rapport d'erreurs. Cas d'usage : migration depuis tableur école.
3. **Espace Parents (portail)** — page login parent, dashboard avec enfants, consultation notes/bulletins téléchargeables, consultation appel, messagerie (placeholder). Débloque workflow invitation.
4. ~~**Page Paramètres**~~ — ✅ 2026-04-24 : `/admin/parametres` livré (4 sections, champ `settings` JSON sur School, migration `add-school-settings`). Câblage progressif aux composants existants (échelle, seuils, créneaux) à faire.
5. ~~**Gestion utilisateurs admin**~~ — ✅ 2026-04-24 : `/admin/utilisateurs` livré (liste paginée, filtres, CRUD, reset password avec affichage one-shot, activation/désactivation, suppression avec protections dernier admin + classes assignées).
6. **Déploiement Vercel + Neon** — configuration env production, script de migration, monitoring de base.

### Pages globales livrées (2026-04-24)
- `/admin/parametres` — paramètres école (infos + pédagogie + créneaux + mentions)
- `/admin/utilisateurs` — CRUD utilisateurs ADMIN/DIRECTEUR/PROFESSEUR
- `/admin/profil` — profil utilisateur connecté + changement mot de passe
- Header dropdown avatar enrichi avec liens contextuels (rôle-aware)
- Page `/admin/modules` : section "Administration" avec liens discrets
- Layout `GlobalPageShell` sans sidebar, bouton "Retour aux modules"

### Bloqué par infrastructure (reporté v0.1)
- **1.3.1–1.3.3** : Setup Supabase Storage (3 buckets + policies + helpers) → débloque uploads photos élèves et pièces jointes devoirs
- **1.4.6** : Workflow invitation parent (token + email SMTP via Resend) → débloque 3.2.2, 3.2.6 ; nécessaire pour Espace Parents

### Règles métier reportées
- **4.1.5** : Restriction modification 7 jours côté prof (contenu, devoirs, notes non verrouillées)
- **5.1.6** : Calcul strict demi-journées d'absence (absent à TOUS les créneaux d'une demi-journée)
- **5.5.2.7** : Mode INDIVIDUAL dans le formulaire évaluation (modèle prêt côté DB)
- **Enforcement `assertYearNotClosed`** dans les Server Actions `saveGrades`/`saveAttendance`/`createEvaluation`/`updateEvaluation` : helper écrit mais pas câblé — à câbler quand les archives deviennent navigables fonctionnellement

### Phase 6 — Polish / déploiement
- **6.3** : Error boundaries (error.tsx)
- **6.5** : Responsive tables → cards sur mobile
- **6.6** : Tests unitaires règles métier (calcul demi-journées, pré-remplissage année, activation/clôture)
- **6.7–6.8** : Déploiement Vercel + Neon production + script de migration
- **6.9** : Revue de sécurité (RLS, injection, XSS, tokens)

### Migrations actives (ordre)
1. `20260416145448_init`
2. `20260416180000_simplify_class_teacher`
3. `20260416200000_add_course_content_homework_fields`
4. `20260417134339_add_subject_hierarchy_evaluations_grades`
5. `20260423131354_add_appreciations_mentions`
6. `20260423133354_add_teacher_fields`
7. `20260423134648_add_council_fields` (councilDecision/Observation + ClassTransition + enum TransitionDecision)
8. `20260423144311_add_academic_year_status` (AcademicYearStatus + trimestres + closedAt)
9. `20260424131920_add_school_settings` (School : description, contactEmail, website, settings Json)
