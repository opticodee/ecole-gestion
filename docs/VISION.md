# Vision Produit — EcoleGestion

## Résumé exécutif

EcoleGestion est un logiciel SaaS de gestion scolaire complet, destiné aux **écoles arabes, coraniques et religieuses** — typiquement des associations cultuelles ou culturelles qui dispensent un enseignement religieux et linguistique sur des créneaux spécifiques (mercredi après-midi, samedi, dimanche).

Ces structures ont des besoins propres que les logiciels scolaires classiques (Pronote, EcoleDirecte) ne couvrent pas : calendrier atypique, matières spécifiques (Coran, Tajwid, Arabe, Fiqh...), niveaux personnalisés, classes non mixtes, organisation associative.

L'objectif est de fournir un outil unique qui centralise toute la gestion administrative, pédagogique et relationnelle de ces établissements.

Le produit est conçu pour être :
- **Modulaire** : chaque domaine fonctionnel est un module indépendant
- **Multi-tenant** : une seule instance peut servir plusieurs écoles
- **Progressif** : déployable module par module
- **Accessible** : interface claire, rapide, utilisable sans formation
- **Adapté** : calendrier, matières, niveaux et classes pensés pour les écoles arabes/coraniques

## Contexte métier

### Type d'établissement
- Écoles arabes / coraniques / religieuses
- Souvent associatives (loi 1901 en France)
- Fonctionnement en complément de l'école classique (pas en remplacement)

### Calendrier de fonctionnement
L'école fonctionne **uniquement** sur 5 demi-journées par semaine :
- **Mercredi après-midi**
- **Samedi matin**
- **Samedi après-midi**
- **Dimanche matin**
- **Dimanche après-midi**

Il n'y a **jamais** de cours du lundi au mardi, ni le jeudi, ni le vendredi, ni le mercredi matin.

### Matières enseignées (exemples)
Coran, Tajwid (règles de récitation), Arabe (lecture, écriture, grammaire), Fiqh (jurisprudence), Sira (biographie du Prophète), Hadith, Aqida (croyance), Mémorisation (Hifz).

### Niveaux
Totalement libres et personnalisables par chaque école. Exemples : Débutant, Coran niveau 1, Sourates courtes, Tajwid initiation, Tajwid avancé, Arabe A1/A2/B1, Mémorisation Juz Amma.

### Classes
Majoritairement **non mixtes** (séparation filles/garçons). Trois options : FILLE, GARCON, MIXTE.

## Utilisateurs cibles

### Phase 1 (actuelle)
- **Administrateurs** : gestion globale, configuration
- **Directeurs** : supervision, tableaux de bord, décisions
- **Professeurs** : saisie de contenus, appel, suivi
- **Personnel administratif** : gestion courante des élèves et familles

### Phase 2 (future)
- **Parents** : consultation des informations de leurs enfants (absences, devoirs, communication)

## Volumétrie cible

- ~500 comptes parents
- ~50 comptes administration (direction, professeurs, personnel)
- Scalable pour multi-écoles (1 à 50 écoles sur une même instance)

## Périmètre actuel — v0.1

### Module Vie scolaire (admin uniquement)

| Fonctionnalité | Priorité |
|---|---|
| Tableau de bord avec KPIs (5 créneaux/semaine) | P0 |
| Gestion des élèves (CRUD + export) | P0 |
| Gestion des parents/familles | P0 |
| Gestion des niveaux de classe (libres) | P0 |
| Gestion des classes (genre FILLE/GARCON/MIXTE) | P0 |
| Gestion des matières (libres) | P0 |
| Contenu de cours | P1 |
| Devoirs | P1 |
| Appel (présence/absence, 5 demi-journées max) | P1 |

## Périmètre futur — Roadmap modules

### v0.2 — Emploi du temps
- Création et gestion des créneaux horaires (dans les 5 demi-journées autorisées)
- Affectation professeurs/matières/classes
- Vue planning hebdomadaire
- Gestion des salles

### v0.3 — Notes et évaluations
- Saisie des notes par matière/classe
- Calcul automatique des moyennes
- Bulletins de notes (génération PDF)
- Système de coefficients configurable

### v0.4 — Espace parents
- Portail dédié avec authentification séparée
- Consultation absences, devoirs, emploi du temps
- Communication avec l'école
- Téléchargement de documents

### v0.5 — Communication
- Messagerie interne (parent-école, prof-parent)
- Notifications (email, push)
- Annonces et circulaires
- Cahier de liaison numérique

### v1.0+ — Modules complémentaires
- Comptabilité / facturation / cotisations
- Inscriptions en ligne
- Gestion RH du personnel / bénévoles
- Rapports et statistiques avancés
- Certificats et attestations

## Principes directeurs

1. **Simplicité d'abord** : chaque écran doit être compréhensible en 5 secondes
2. **Données fiables** : une seule source de vérité pour chaque information
3. **Performance** : temps de chargement < 2s sur toutes les pages
4. **Sécurité** : données sensibles (enfants mineurs), conformité RGPD obligatoire
5. **Évolutivité** : l'ajout d'un module ne doit pas impacter les modules existants
6. **Multi-tenant natif** : chaque donnée est isolée par école (tenant)
7. **Calendrier contraint** : le système impose les 5 demi-journées autorisées comme contrainte fondamentale

## Positionnement

**Premier SaaS de gestion scolaire dédié aux écoles arabes/coraniques/religieuses.**

Il n'existe pas aujourd'hui de solution adaptée à ce segment. Les outils existants (Pronote, EcoleDirecte, MyScol) sont conçus pour des écoles classiques avec un calendrier lundi-vendredi et des matières standards.

Différenciateurs :
- Calendrier natif mercredi/samedi/dimanche
- Matières et niveaux libres, adaptés à l'enseignement religieux et linguistique
- Classes non mixtes par défaut
- Interface moderne et intuitive
- Déploiement cloud sans installation
- Modularité réelle (payer uniquement ce qu'on utilise)
- Prix accessible pour des structures associatives
