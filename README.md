# EcoleGestion — Logiciel SaaS de gestion d'école arabe / coranique

## Présentation

EcoleGestion est une plateforme modulaire de gestion scolaire, conçue spécifiquement pour les **écoles arabes, coraniques et religieuses** (associations, structures du mercredi/week-end). Le logiciel couvre l'ensemble des besoins administratifs et pédagogiques de ces établissements : vie scolaire, gestion des élèves, familles, emplois du temps, contenus pédagogiques, et plus encore.

Ces écoles fonctionnent sur des créneaux spécifiques (mercredi après-midi, samedi et dimanche) et enseignent des matières comme le Coran, le Tajwid, l'arabe, le Fiqh ou la Sira. EcoleGestion est le premier outil SaaS pensé nativement pour ce segment.

Le projet est pensé dès le départ comme un produit SaaS multi-écoles, évolutif et professionnel.

## Stack technique

| Composant | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Base de données | PostgreSQL (Neon) |
| ORM | Prisma |
| Authentification | NextAuth.js (Auth.js v5) |
| UI | Tailwind CSS + shadcn/ui |
| Stockage fichiers | Supabase Storage |
| Hébergement | Vercel + Neon |
| Exports | xlsx, jsPDF, papaparse |

## Périmètre actuel (v0.1)

**Module : Vie scolaire** — interface administration uniquement.

- Tableau de bord avec KPIs et planning (créneaux : mercredi PM, samedi AM/PM, dimanche AM/PM)
- Gestion des élèves
- Gestion des parents/familles
- Contenu de cours
- Devoirs
- Gestion des niveaux (libres : Coran niveau 1, Tajwid, Arabe A1...), classes (non mixtes par défaut), matières

## Modules futurs prévus

- Espace parents (portail dédié)
- Emploi du temps / planning avancé
- Notes et bulletins
- Comptabilité / facturation
- Communication (messagerie, notifications)
- Rapports et statistiques avancés

## Documentation du projet

| Document | Description |
|---|---|
| [VISION.md](docs/VISION.md) | Vision produit, périmètre actuel et futur |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture technique et structure projet |
| [SPECS-VIE-SCOLAIRE.md](docs/SPECS-VIE-SCOLAIRE.md) | Spécifications détaillées écran par écran |
| [MODELE-DONNEES.md](docs/MODELE-DONNEES.md) | Entités, champs, relations, schéma Prisma |
| [REGLES-METIER.md](docs/REGLES-METIER.md) | Règles métier, calculs, alertes |
| [IMPLEMENTATION.md](docs/IMPLEMENTATION.md) | Plan d'implémentation et décisions |
| [TASKS.md](docs/TASKS.md) | Backlog structuré par phases |

## Comment utiliser cette documentation

1. Lire `VISION.md` pour comprendre le produit
2. Lire `ARCHITECTURE.md` pour comprendre la structure technique
3. Lire `SPECS-VIE-SCOLAIRE.md` pour le détail fonctionnel écran par écran
4. Consulter `MODELE-DONNEES.md` pour le schéma de données
5. Se référer à `REGLES-METIER.md` pour les cas particuliers
6. Suivre `IMPLEMENTATION.md` pour le plan de développement
7. Utiliser `TASKS.md` comme backlog de travail

## Licence

Propriétaire — Tous droits réservés.
