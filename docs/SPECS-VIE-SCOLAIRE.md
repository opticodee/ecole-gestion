# Spécifications fonctionnelles — Module Vie scolaire

## Résumé

Ce document détaille chaque écran du module Vie scolaire, côté administration. Chaque section couvre : objectif, éléments affichés, actions disponibles, données impliquées, règles métier et idées UX.

**Contexte** : école arabe/coranique fonctionnant uniquement sur 5 demi-journées : mercredi après-midi, samedi matin, samedi après-midi, dimanche matin, dimanche après-midi.

---

## Navigation du module

Le module Vie scolaire est accessible depuis la sidebar principale. Il contient les onglets suivants :

1. **Tableau de bord** (page par défaut)
2. **Élèves**
3. **Parents / Familles**
4. **Contenu de cours**
5. **Devoirs**
6. **Niveaux**
7. **Classes**
8. **Matières**

La navigation entre onglets se fait via un menu secondaire horizontal (tabs) sous le header du module.

---

## 1. Tableau de bord — `/vie-scolaire`

### Objectif
Donner une vue synthétique instantanée de l'état de la vie scolaire. Permettre un accès rapide aux actions courantes.

### Éléments affichés

#### Ligne de KPIs (4 cards)
| KPI | Donnée | Icône |
|---|---|---|
| Enseignants | Nombre total de professeurs actifs | Users |
| Élèves inscrits | Nombre total d'élèves avec statut "inscrit" | GraduationCap |
| Classes | Nombre total de classes actives | School |
| Taux de présence | % de présence sur la semaine en cours | CheckCircle |

#### Planning de la semaine
- Vue calendrier horizontal affichant **uniquement les 3 jours d'enseignement** :
  - **Mercredi** (après-midi uniquement)
  - **Samedi** (matin + après-midi)
  - **Dimanche** (matin + après-midi)
- Affiche les cours du prochain jour d'enseignement par défaut
- Chaque créneau affiche : matière, professeur, classe, salle, horaire
- Navigation ← → entre les jours d'enseignement (pas les jours calendaires)
- Séparation visuelle matin / après-midi pour samedi et dimanche
- Le mercredi n'affiche que l'après-midi

#### Prochains cours avec appel
- Liste des 5 prochains cours (à partir du moment actuel, en tenant compte du calendrier mercredi/samedi/dimanche)
- Pour chaque cours : matière, classe, horaire, professeur
- Bouton **"Faire l'appel"** → ouvre une modale d'appel

#### Absences de la dernière séance
- Nombre d'élèves absents lors de la dernière demi-journée de cours
- Liste des 5 dernières absences enregistrées
- Lien "Voir tout" vers un filtre pré-appliqué

#### Alertes — Élèves à 4+ demi-journées d'absence
- Liste des élèves ayant atteint ou dépassé 4 demi-journées d'absence (non justifiées) sur le mois en cours
- Maximum théorique : 5 demi-journées/semaine, soit ~20 demi-journées/mois
- Affiche : nom, prénom, classe, nombre de demi-journées
- Badge rouge "Alerte" si ≥ 4
- Action : cliquer pour voir la fiche élève

### Actions
- Clic sur un cours → détail du cours
- Clic sur "Faire l'appel" → modale d'appel
- Clic sur un élève en alerte → fiche élève
- Filtres : semaine courante / semaine précédente / semaine suivante

### Données nécessaires
- `Teacher` (count)
- `Student` (count, status = INSCRIT)
- `ClassGroup` (count)
- `Schedule` (planning, filtré sur TimeSlot autorisés)
- `Attendance` (absences, calcul demi-journées)

---

## 2. Élèves — `/vie-scolaire/eleves`

### Objectif
Gérer la liste complète des élèves de l'école. Rechercher, filtrer, exporter, et accéder aux fiches individuelles.

### Éléments affichés

#### Barre d'actions (haut de page)
- Bouton **"+ Ajouter un élève"** → `/vie-scolaire/eleves/nouveau`
- Boutons d'export : **CSV**, **Excel**, **PDF**
- Bouton **"Imprimer"** (impression navigateur)

#### Barre de recherche et filtres
- Champ de recherche textuel (nom, prénom)
- Filtres : genre, classe, niveau, statut

#### Table des élèves

| Colonne | Donnée |
|---|---|
| Genre | M / F (icône ou badge) |
| Nom | Nom de famille |
| Prénom | Prénom |
| Date de naissance | Format JJ/MM/AAAA |
| Classe | Libellé de la classe |
| Niveau | Libellé du niveau |
| Actions | Menu contextuel |

- Tri possible sur chaque colonne
- Pagination (20 élèves par page par défaut)

#### Actions par élève (menu "...")
1. **Voir emploi du temps** → affiche l'emploi du temps de la classe de l'élève (mercredi/samedi/dimanche)
2. **Contacter** → toast "Messagerie bientôt disponible" (placeholder v0.1)
3. **Contacter parents** → toast "Messagerie bientôt disponible" (placeholder v0.1)
4. **Voir fiche administrative** → page détail avec toutes les informations
5. **Modifier profil** → formulaire d'édition

### Page création/édition élève — `/vie-scolaire/eleves/nouveau` ou `/vie-scolaire/eleves/[id]`

#### Champs du formulaire

| Champ | Type | Requis | Notes |
|---|---|---|---|
| Genre | Select (M/F) | Oui | |
| Nom | Text | Oui | |
| Prénom | Text | Oui | |
| Date de naissance | Date picker | Oui | |
| Lieu de naissance | Text | Non | |
| Nationalité | Text | Non | Défaut : pays de l'école |
| Adresse | Textarea | Non | |
| Niveau | Select | Oui | Liste des niveaux actifs (ex: Coran niveau 1, Tajwid initiation...) |
| Classe | Select | Oui | Filtré par niveau + compatibilité genre |
| Statut | Select | Oui | INSCRIT, EN_ATTENTE, RADIE |
| Photo | Upload image | Non | Stocké sur Supabase Storage (bucket photos-eleves) |
| Numéro matricule | Auto-généré | — | Format : ECO-AAAA-XXXX |
| Date d'inscription | Date | Oui | Défaut : aujourd'hui |
| Observations | Textarea | Non | Notes internes |

#### Lien parent
- Section "Parents / Responsables" en bas du formulaire
- Recherche d'un parent existant ou création rapide
- Possibilité de lier 1 à 2 parents/responsables
- Pour chaque parent : relation (père, mère, tuteur, autre)

### Fiche élève — `/vie-scolaire/eleves/[id]`

Affiche en lecture toutes les informations de l'élève, organisées en onglets :
- **Informations personnelles** : identité, contact, adresse
- **Scolarité** : classe, niveau, historique des classes
- **Parents** : liste des parents liés avec accès à leur fiche
- **Absences** : historique des absences avec statut (justifiée/non justifiée), compteur de demi-journées
- **Emploi du temps** : planning de la classe (mercredi PM / samedi AM+PM / dimanche AM+PM)

---

## 3. Parents / Familles — `/vie-scolaire/parents`

### Objectif
Gérer les comptes parents/responsables légaux. Lier les parents à leurs enfants. Préparer les futurs comptes de connexion.

### Éléments affichés

#### Barre d'actions
- Bouton **"+ Ajouter un parent"**
- Boutons d'export : CSV, Excel, PDF
- Bouton Imprimer

#### Barre de recherche et filtres
- Recherche par nom, prénom, email
- Filtre par : classe des enfants, niveau

#### Table des parents

| Colonne | Donnée |
|---|---|
| Nom | Nom de famille |
| Prénom | Prénom |
| Email | Email (= futur identifiant de connexion) |
| Téléphone | Numéro principal |
| Enfant(s) | Liste des prénoms des enfants liés |
| Statut compte | Invité / Actif (a défini son mot de passe ou non) |
| Actions | Menu contextuel |

#### Actions par parent (menu "...")
1. **Discussion** → toast "Messagerie bientôt disponible" (placeholder v0.1)
2. **Modifier** → formulaire d'édition parent
3. **Voir fiche parent** → page détail
4. **Ajouter un enfant** → formulaire création élève pré-lié au parent
5. **Renvoyer l'invitation** → renvoie l'email d'invitation si le compte n'est pas encore activé

### Accès depuis un enfant (fiche élève → section parents)
Depuis la fiche d'un élève, on peut accéder à :
- Fiche de l'enfant (informations complètes)
- Infos enfant (résumé rapide)
- Parcours scolaire (historique classes/niveaux)
- Infos parents (accès direct à la fiche parent)
- Ajouter frère/sœur (création élève pré-lié aux mêmes parents)

### Page création/édition parent — `/vie-scolaire/parents/nouveau`

#### Champs du formulaire

| Champ | Type | Requis | Notes |
|---|---|---|---|
| Genre | Select (M/F) | Oui | |
| Nom | Text | Oui | |
| Prénom | Text | Oui | |
| Email | Email | Oui | Unique, servira d'identifiant. Déclenche l'envoi d'un email d'invitation. |
| Téléphone principal | Tel | Oui | |
| Téléphone secondaire | Tel | Non | |
| Adresse | Textarea | Non | |
| Profession | Text | Non | |
| Relation | Select | Oui | Père, Mère, Tuteur, Autre |
| Observations | Textarea | Non | |

#### Workflow d'invitation
- À la création du parent, un compte `User` (rôle PARENT) est créé avec un token d'invitation.
- Un email est envoyé au parent avec un lien pour définir son mot de passe.
- Le compte reste en statut "invité" tant que le mot de passe n'est pas défini.
- L'admin peut renvoyer l'invitation à tout moment.

#### Lien enfants
- Section "Enfants" en bas du formulaire
- Recherche d'un élève existant ou création rapide
- Possibilité de lier plusieurs enfants
- Affiche la liste des enfants déjà liés

---

## 4. Contenu de cours — `/vie-scolaire/contenu-cours`

### Objectif
Permettre aux professeurs et à l'administration de documenter le contenu pédagogique dispensé lors de chaque séance de cours.

### Éléments affichés

#### Formulaire de saisie rapide (haut de page)

| Champ | Type | Requis |
|---|---|---|
| Date | Date picker | Oui (défaut : aujourd'hui, **restreint aux jours autorisés** : mercredi, samedi, dimanche) |
| Professeur | Select | Oui |
| Matière | Select | Oui (ex: Coran, Tajwid, Arabe, Fiqh...) |
| Classe | Select | Oui |
| Niveau | Select | Auto (déduit de la classe) |
| Créneau | Select | Oui (filtré selon le jour : PM seul le mercredi, AM/PM le samedi/dimanche) |
| Description du contenu | Textarea (riche) | Oui |

Bouton **"Enregistrer"** pour valider la saisie.

#### Liste des contenus de cours (sous le formulaire)

| Colonne | Donnée |
|---|---|
| Date | JJ/MM/AAAA |
| Professeur | Nom complet |
| Matière | Libellé |
| Classe | Libellé |
| Créneau | HH:MM - HH:MM |
| Actions | Voir détail, Modifier, Supprimer |

- Filtrable par : date, professeur, matière, classe
- Tri par date (plus récent en premier)
- Pagination

### Page détail contenu
Affiche le contenu complet avec possibilité de modifier ou supprimer.

---

## 5. Devoirs — `/vie-scolaire/devoirs`

### Objectif
Gérer les devoirs assignés aux élèves. Même logique que le contenu de cours, avec des champs spécifiques aux devoirs.

### Éléments affichés

#### Formulaire de saisie rapide

| Champ | Type | Requis |
|---|---|---|
| Date de création | Date picker | Oui (défaut : aujourd'hui) |
| Date limite | Date picker | Oui (doit tomber un mercredi, samedi ou dimanche — jour de cours) |
| Professeur | Select | Oui |
| Matière | Select | Oui (ex: Coran, Tajwid, Arabe...) |
| Classe | Select | Oui |
| Niveau | Select | Auto (déduit de la classe) |
| Description du devoir | Textarea (riche) | Oui |
| Pièce jointe | Upload fichier | Non (Supabase Storage, bucket pieces-jointes-devoirs) |

#### Liste des devoirs

| Colonne | Donnée |
|---|---|
| Date limite | JJ/MM/AAAA |
| Professeur | Nom complet |
| Matière | Libellé |
| Classe | Libellé |
| Statut | À venir / En cours / Passé |
| Actions | Voir détail, Modifier, Supprimer |

### Règles
- Le statut est calculé automatiquement : "À venir" si date limite > aujourd'hui + 2j, "En cours" si dans les 2 prochains jours, "Passé" si date dépassée
- Les devoirs passés restent visibles mais grisés

---

## 6. Niveaux — `/vie-scolaire/niveaux`

### Objectif
Configurer les niveaux de classe de l'école. Les niveaux sont **totalement libres** et personnalisables par chaque école — il n'y a pas de niveaux standards imposés.

### Exemples de niveaux typiques
- Débutant, Intermédiaire, Avancé
- Coran niveau 1, Coran niveau 2, Coran niveau 3
- Sourates courtes, Juz Amma, Juz Tabarak
- Tajwid initiation, Tajwid avancé
- Arabe A1, Arabe A2, Arabe B1
- Mémorisation Juz Amma

### Éléments affichés

#### Bouton "+ Créer un niveau" → ouvre une modale

#### Table des niveaux

| Colonne | Donnée | Notes |
|---|---|---|
| Libellé | Nom du niveau | Texte libre (ex: "Tajwid avancé") |
| Code | Code court | Texte libre (ex: "TAJ-AV") |
| Ordre | Position d'affichage | Pour le tri logique |
| Nombre de places | Capacité totale du niveau | Somme des places des classes |
| Élèves inscrits | Nombre actuel | Calculé |
| Classes | Nombre de classes dans ce niveau | Calculé |
| Taux de remplissage | % | (inscrits / places) × 100 |
| Actions | Modifier, Supprimer | |

#### Modale de création/édition

| Champ | Type | Requis |
|---|---|---|
| Libellé | Text (libre) | Oui |
| Code | Text (libre) | Oui (unique par école) |
| Ordre d'affichage | Number | Oui |
| Description | Textarea | Non |

### Règles
- Un niveau ne peut être supprimé que s'il ne contient aucune classe
- Le nombre de places et le taux de remplissage sont calculés depuis les classes rattachées

---

## 7. Classes — `/vie-scolaire/classes`

### Objectif
Gérer les classes de l'école. Les classes sont **majoritairement non mixtes** (séparation filles/garçons).

### Exemples de classes typiques
- Coran N1 - Garçons, Coran N1 - Filles
- Tajwid Avancé - Garçons A, Tajwid Avancé - Garçons B
- Arabe A1 - Mixte

### Éléments affichés

#### Bouton "+ Créer une classe" → ouvre une modale

#### Table des classes

| Colonne | Donnée |
|---|---|
| Libellé | Nom de la classe |
| Niveau | Niveau rattaché |
| Genre | Filles / Garçons / Mixte (badge coloré) |
| Période | Trimestre / Semestre / Bimestre / Période |
| Nombre de places | Capacité maximale |
| Élèves inscrits | Nombre actuel |
| Taux de remplissage | % |
| Actions | Modifier, Supprimer, Voir élèves |

#### Modale de création/édition

| Champ | Type | Requis | Notes |
|---|---|---|---|
| Libellé | Text | Oui | |
| Niveau | Select | Oui | Niveaux libres de l'école |
| Genre de la classe | Select (Filles / Garçons / Mixte) | Oui | **Défaut : Garçons** (non mixte par défaut) |
| Période | Select (Trimestre/Semestre/Bimestre/Période) | Oui | **Défaut : Trimestre** |
| Nombre de places | Number | Oui | |
| Professeur principal | Select | Non | |
| Salle | Text | Non | |

### Règles
- Une classe ne peut être supprimée que si elle ne contient aucun élève
- L'inscription d'un élève dans une classe pleine est bloquée (nombre inscrits < nombre de places)
- Le genre de la classe est défini explicitement à la création (FILLE, GARCON ou MIXTE)
- Si la classe est FILLE ou GARCON, seuls les élèves du genre correspondant peuvent y être inscrits
- Si la classe est MIXTE, tous les élèves peuvent y être inscrits

---

## 8. Matières — `/vie-scolaire/matieres`

### Objectif
Gérer le catalogue des matières enseignées dans l'école. Les matières sont **totalement libres** et adaptées à l'enseignement arabe/coranique.

### Exemples de matières typiques
- Coran (récitation)
- Tajwid (règles de récitation)
- Arabe — Lecture
- Arabe — Écriture
- Arabe — Grammaire
- Fiqh (jurisprudence islamique)
- Sira (biographie du Prophète)
- Hadith
- Aqida (croyance)
- Langue arabe
- Mémorisation (Hifz)

### Éléments affichés

#### Bouton "+ Créer une matière" → ouvre une modale

#### Table des matières

| Colonne | Donnée |
|---|---|
| Libellé | Nom de la matière |
| Code | Code court |
| Heures à planifier | Volume horaire hebdomadaire prévu (sur les 5 demi-journées) |
| Heures planifiées | Volume horaire effectivement dans l'emploi du temps |
| Écart | Différence (heures à planifier - heures planifiées) |
| Professeurs | Nombre de professeurs enseignant cette matière |
| Actions | Modifier, Supprimer |

#### Modale de création/édition

| Champ | Type | Requis |
|---|---|---|
| Libellé | Text (libre) | Oui |
| Code | Text (libre) | Oui (unique par école) |
| Heures à planifier | Number (décimal) | Oui |
| Description | Textarea | Non |
| Couleur | Color picker | Non (pour l'emploi du temps) |

### Règles
- Une matière ne peut être supprimée que si elle n'est utilisée dans aucun cours ou emploi du temps
- L'écart d'heures sert d'indicateur : vert si écart = 0, orange si écart > 0, rouge si écart < 0
- Le volume horaire total disponible par semaine est limité aux 5 demi-journées (~15h max environ)

---

## 9. Modale d'appel (transverse)

### Objectif
Permettre de faire l'appel pour un cours donné. Accessible depuis le tableau de bord ou depuis n'importe quel cours.

### Éléments affichés

#### En-tête
- Matière, classe, professeur, date, créneau horaire
- Indication du créneau : ex. "Samedi matin", "Dimanche après-midi", "Mercredi après-midi"

#### Liste des élèves de la classe

| Colonne | Donnée |
|---|---|
| Nom Prénom | Identité de l'élève |
| Statut | Boutons radio : Présent / Absent / Retard / Excusé |
| Motif | Champ texte (visible si Absent ou Retard) |

- Tous les élèves sont "Présent" par défaut
- Bouton **"Tous présents"** pour validation rapide
- Bouton **"Enregistrer l'appel"** pour sauvegarder

### Règles
- Un appel ne peut être fait qu'une seule fois par cours/créneau (modifiable ensuite)
- Un appel ne peut être créé que pour un créneau autorisé (mercredi PM, samedi AM/PM, dimanche AM/PM)
- Le calcul strict des demi-journées : absent à **tous les créneaux** d'une demi-journée = 1 demi-journée d'absence comptée
- Un retard > 15 minutes est comptabilisé comme une absence
- Maximum 5 demi-journées d'absence possibles par semaine

---

## Idées UX transversales

- **Breadcrumb** sur toutes les pages pour la navigation contextuelle
- **Toast notifications** pour toutes les actions (création, modification, suppression, export)
- **Toast "Messagerie bientôt disponible"** au clic sur Contacter / Discussion (placeholder v0.1)
- **Confirmation modale** avant toute suppression
- **Empty states** informatifs avec action suggérée ("Aucun élève inscrit. Ajouter un élève →")
- **Raccourcis clavier** : Ctrl+N pour nouvelle entité, Ctrl+F pour recherche
- **Responsive** : les tables deviennent des cards sur mobile
- **Loading states** : skeletons sur les tables et les KPIs
- **Recherche globale** (futur) : barre de recherche dans le header pour trouver un élève, parent, classe depuis n'importe où
- **Badges genre classe** : couleurs distinctes pour Filles (rose), Garçons (bleu), Mixte (vert)
