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
| 1.1.1 | Init Next.js 15 + TypeScript | P0 | S | [ ] | — |
| 1.1.2 | Configurer Tailwind CSS | P0 | S | [ ] | 1.1.1 |
| 1.1.3 | Installer et configurer shadcn/ui | P0 | S | [ ] | 1.1.2 |
| 1.1.4 | Configurer ESLint + Prettier | P0 | S | [ ] | 1.1.1 |
| 1.1.5 | Créer le fichier .env.example (Neon, Auth.js, Supabase, SMTP) | P0 | S | [ ] | 1.1.1 |

### 1.2 Base de données
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 1.2.1 | Installer Prisma + configurer PostgreSQL | P0 | S | [ ] | 1.1.1 |
| 1.2.2 | Écrire le schéma Prisma complet (enums TimeSlot, ClassGender, etc.) | P0 | L | [ ] | 1.2.1 |
| 1.2.3 | Exécuter la migration initiale | P0 | S | [ ] | 1.2.2 |
| 1.2.4 | Écrire le seed (école coranique, users, niveaux libres, classes non mixtes, élèves, parents, matières coraniques) | P0 | L | [ ] | 1.2.3 |
| 1.2.5 | Créer le client Prisma singleton (lib/prisma.ts) | P0 | S | [ ] | 1.2.1 |
| 1.2.6 | Configurer les 5 créneaux horaires autorisés (constantes TimeSlot + helpers de validation jour/créneau) | P0 | M | [ ] | 1.2.2 |

### 1.3 Stockage fichiers
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 1.3.1 | Setup Supabase Storage + créer les 3 buckets (photos-eleves, pieces-jointes-devoirs, documents-administratifs) | P0 | M | [ ] | 1.1.5 |
| 1.3.2 | Créer les helpers upload/download/delete pour Supabase Storage | P0 | M | [ ] | 1.3.1 |
| 1.3.3 | Configurer les policies d'accès Supabase (lecture authentifiée) | P1 | S | [ ] | 1.3.1 |

### 1.4 Authentification
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 1.4.1 | Configurer Auth.js v5 (credentials provider) | P0 | M | [ ] | 1.2.4 |
| 1.4.2 | Créer la page de login | P0 | M | [ ] | 1.4.1 |
| 1.4.3 | Middleware de protection des routes | P0 | M | [ ] | 1.4.1 |
| 1.4.4 | Helper getSession avec rôle et schoolId | P0 | S | [ ] | 1.4.1 |
| 1.4.5 | Redirection post-login selon le rôle | P1 | S | [ ] | 1.4.4 |
| 1.4.6 | Workflow invitation parent (génération token, envoi email, page de définition MDP) | P0 | L | [ ] | 1.4.1 |

### 1.5 Layout admin
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 1.5.1 | Layout principal (dashboard) avec sidebar | P0 | L | [ ] | 1.4.3 |
| 1.5.2 | Header avec user info et logout | P0 | M | [ ] | 1.5.1 |
| 1.5.3 | Sidebar avec navigation modules/onglets | P0 | M | [ ] | 1.5.1 |
| 1.5.4 | Composant Breadcrumb | P1 | S | [ ] | 1.5.1 |
| 1.5.5 | Tabs de navigation du module Vie scolaire | P0 | M | [ ] | 1.5.1 |

### 1.6 Composants partagés
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 1.6.1 | Composant DataTable générique (tri, filtre, pagination) | P0 | XL | [ ] | 1.1.3 |
| 1.6.2 | Composant ExportButtons (CSV, Excel, PDF) | P1 | L | [ ] | 1.6.1 |
| 1.6.3 | Composant SearchBar | P0 | S | [ ] | 1.1.3 |
| 1.6.4 | Composant StatCard (KPI) | P1 | S | [ ] | 1.1.3 |
| 1.6.5 | Composant ConfirmDialog | P0 | S | [ ] | 1.1.3 |
| 1.6.6 | Composant EmptyState | P2 | S | [ ] | 1.1.3 |
| 1.6.7 | Composant PageHeader | P0 | S | [ ] | 1.1.3 |
| 1.6.8 | Composant FormModal | P0 | M | [ ] | 1.1.3 |
| 1.6.9 | Composant PlaceholderToast ("Messagerie bientôt disponible") | P1 | S | [ ] | 1.1.3 |

---

## Phase 2 — Entités de configuration

### 2.1 Niveaux
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 2.1.1 | Page liste des niveaux (libellés libres) | P0 | M | [ ] | 1.6.1 |
| 2.1.2 | Modale création/édition niveau (texte libre, pas de niveaux standards) | P0 | M | [ ] | 1.6.8 |
| 2.1.3 | Server Actions CRUD niveau | P0 | M | [ ] | 1.2.5 |
| 2.1.4 | Validation Zod niveau | P0 | S | [ ] | — |
| 2.1.5 | Calcul agrégations (places, inscrits, taux) | P0 | M | [ ] | 2.1.3 |
| 2.1.6 | Protection suppression (si classes liées) | P0 | S | [ ] | 2.1.3 |

### 2.2 Classes
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 2.2.1 | Page liste des classes (avec badge genre : Filles/Garçons/Mixte) | P0 | M | [ ] | 1.6.1, 2.1.1 |
| 2.2.2 | Modale création/édition classe (genre FILLE/GARCON/MIXTE, défaut GARCON, période défaut TRIMESTRE) | P0 | L | [ ] | 1.6.8, 2.1.3 |
| 2.2.3 | Server Actions CRUD classe | P0 | M | [ ] | 1.2.5 |
| 2.2.4 | Validation Zod classe | P0 | S | [ ] | — |
| 2.2.5 | Sélection niveau → filtre cascade | P0 | M | [ ] | 2.1.3 |
| 2.2.6 | Validation genre élève vs genre classe à l'inscription | P0 | M | [ ] | 2.2.3 |
| 2.2.7 | Protection suppression (si élèves liés) | P0 | S | [ ] | 2.2.3 |

### 2.3 Matières
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 2.3.1 | Page liste des matières (libellés libres, exemples coraniques) | P0 | M | [ ] | 1.6.1 |
| 2.3.2 | Modale création/édition matière (texte libre) | P0 | M | [ ] | 1.6.8 |
| 2.3.3 | Server Actions CRUD matière | P0 | M | [ ] | 1.2.5 |
| 2.3.4 | Validation Zod matière (heures max 15h/semaine) | P0 | S | [ ] | — |
| 2.3.5 | Calcul écart heures planifiées | P1 | M | [ ] | 2.3.3 |
| 2.3.6 | Protection suppression (si cours/devoirs liés) | P0 | S | [ ] | 2.3.3 |

---

## Phase 3 — Élèves et parents

### 3.1 Élèves
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 3.1.1 | Page liste des élèves (table + recherche + filtres) | P0 | L | [ ] | 1.6.1, 2.2.1 |
| 3.1.2 | Page création élève (formulaire complet, filtrage classes par genre) | P0 | L | [ ] | 2.1.3, 2.2.3 |
| 3.1.3 | Génération automatique matricule | P0 | M | [ ] | 1.2.5 |
| 3.1.4 | Validation Zod élève | P0 | M | [ ] | — |
| 3.1.5 | Page fiche élève (lecture, onglets) | P0 | L | [ ] | 3.1.1 |
| 3.1.6 | Page édition élève | P0 | M | [ ] | 3.1.2 |
| 3.1.7 | Contrôle capacité classe à l'inscription | P0 | M | [ ] | 3.1.2 |
| 3.1.8 | Contrôle genre élève vs genre classe | P0 | S | [ ] | 3.1.2 |
| 3.1.9 | Section parents dans la fiche élève | P0 | M | [ ] | 3.2.1 |
| 3.1.10 | Exports CSV/Excel/PDF de la liste élèves | P1 | M | [ ] | 1.6.2 |
| 3.1.11 | Boutons Contacter / Contacter parents → toast placeholder | P1 | S | [ ] | 1.6.9 |
| 3.1.12 | Upload photo élève via Supabase Storage | P1 | M | [ ] | 1.3.2 |

### 3.2 Parents
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 3.2.1 | Page liste des parents (table + recherche + colonne statut invitation) | P0 | L | [ ] | 1.6.1 |
| 3.2.2 | Page création parent (formulaire + création User + envoi email invitation) | P0 | L | [ ] | 1.2.5, 1.4.6 |
| 3.2.3 | Validation Zod parent | P0 | M | [ ] | — |
| 3.2.4 | Liaison parent-élève (dans formulaire parent et élève) | P0 | L | [ ] | 3.1.1, 3.2.1 |
| 3.2.5 | Page fiche parent (avec liste enfants + statut invitation) | P0 | M | [ ] | 3.2.1 |
| 3.2.6 | Bouton "Renvoyer l'invitation" (si compte non activé) | P1 | S | [ ] | 3.2.2 |
| 3.2.7 | Ajout frère/sœur depuis fiche élève | P1 | M | [ ] | 3.2.4 |
| 3.2.8 | Exports CSV/Excel/PDF de la liste parents | P1 | M | [ ] | 1.6.2 |
| 3.2.9 | Bouton Discussion → toast placeholder | P1 | S | [ ] | 1.6.9 |

---

## Phase 4 — Contenu pédagogique

### 4.1 Contenu de cours
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 4.1.1 | Page contenu de cours (formulaire + liste) | P1 | L | [ ] | 2.2.1, 2.3.1 |
| 4.1.2 | Server Actions CRUD contenu de cours | P1 | M | [ ] | 1.2.5 |
| 4.1.3 | Validation Zod contenu de cours (date doit tomber mercredi/samedi/dimanche) | P1 | M | [ ] | 1.2.6 |
| 4.1.4 | Filtrage par date/prof/matière/classe | P1 | M | [ ] | 4.1.1 |
| 4.1.5 | Restriction modification 7 jours (professeur) | P2 | S | [ ] | 4.1.2 |

### 4.2 Devoirs
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 4.2.1 | Page devoirs (formulaire + liste) | P1 | L | [ ] | 2.2.1, 2.3.1 |
| 4.2.2 | Server Actions CRUD devoirs | P1 | M | [ ] | 1.2.5 |
| 4.2.3 | Validation Zod devoirs (date limite sur jour de cours) | P1 | M | [ ] | 1.2.6 |
| 4.2.4 | Calcul automatique statut (À venir/En cours/Passé) | P1 | S | [ ] | 4.2.2 |
| 4.2.5 | Upload pièce jointe via Supabase Storage | P1 | M | [ ] | 1.3.2 |

---

## Phase 5 — Appel et dashboard

### 5.1 Appel
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 5.1.1 | Modale d'appel (liste élèves, statuts radio, créneau TimeSlot) | P1 | L | [ ] | 3.1.1 |
| 5.1.2 | Server Action enregistrement appel (validation créneau autorisé) | P1 | M | [ ] | 1.2.6 |
| 5.1.3 | Bouton "Tous présents" | P1 | S | [ ] | 5.1.1 |
| 5.1.4 | Calcul automatique halfDay = TimeSlot du créneau | P1 | S | [ ] | 5.1.2 |
| 5.1.5 | Modification d'un appel existant | P1 | M | [ ] | 5.1.2 |
| 5.1.6 | Calcul strict demi-journées d'absence (absent à TOUS les créneaux d'une demi-journée) | P1 | L | [ ] | 5.1.4 |

### 5.2 Dashboard
| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 5.2.1 | KPIs : enseignants, élèves, classes, taux de présence | P1 | M | [ ] | 1.6.4 |
| 5.2.2 | Planning de la semaine (3 jours : mercredi PM / samedi AM+PM / dimanche AM+PM) | P1 | L | [ ] | 1.2.6 |
| 5.2.3 | Prochains cours avec bouton d'appel (logique mercredi/samedi/dimanche) | P1 | L | [ ] | 5.1.1 |
| 5.2.4 | Absences de la dernière séance (liste + lien) | P1 | M | [ ] | 5.1.2 |
| 5.2.5 | Alertes : élèves ≥ 4 demi-journées d'absence (sur 5 max/semaine) | P1 | L | [ ] | 5.1.6 |

---

## Phase 6 — Polish et déploiement

| # | Tâche | Priorité | Complexité | Statut | Dépendances |
|---|---|---|---|---|---|
| 6.1 | Empty states sur tous les écrans | P2 | M | [ ] | Toutes les pages |
| 6.2 | Loading skeletons | P2 | M | [ ] | Toutes les pages |
| 6.3 | Error boundaries (error.tsx) | P1 | M | [ ] | 1.5.1 |
| 6.4 | Toast notifications | P1 | M | [ ] | 1.1.3 |
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
| 2 - Configuration | 19 | 16 | 3 | 0 | 1 semaine |
| 3 - Élèves/Parents | 21 | 14 | 7 | 0 | 2 semaines |
| 4 - Pédagogie | 10 | 0 | 9 | 1 | 1 semaine |
| 5 - Appel/Dashboard | 11 | 0 | 11 | 0 | 2 semaines |
| 6 - Polish | 9 | 0 | 5 | 4 | 1 semaine |
| **Total** | **100** | **52** | **41** | **7** | **~9 semaines** |

---

## Bloqueurs résolus

| # | Ancien bloqueur | Résolution |
|---|---|---|
| B1 | Choix du provider Neon (gratuit vs payé) | Neon free tier pour v0.1, upgrade si nécessaire |
| B2 | Gestion des uploads (photos, pièces jointes) | **Supabase Storage** — 3 buckets configurés |
| B3 | Envoi d'emails (bienvenue, contact) | Service email à choisir (Resend recommandé) — nécessaire pour Phase 1 (invitation parents) |

---

## Prochaines étapes immédiates

1. **Tâche 1.1.1** : Init Next.js 15 + TypeScript (`npx create-next-app@latest`)
2. **Tâche 1.1.2 + 1.1.3** : Configurer Tailwind CSS + shadcn/ui
3. **Tâche 1.2.1 + 1.2.2** : Installer Prisma + écrire le schéma complet avec les nouveaux enums
