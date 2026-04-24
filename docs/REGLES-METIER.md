# Règles métier — Module Vie scolaire

## Résumé

Ce document recense toutes les règles métier, validations, calculs automatiques, alertes et cas particuliers du module Vie scolaire.

**Contexte** : école arabe/coranique, fonctionnement mercredi PM / samedi / dimanche uniquement (5 demi-journées max par semaine).

---

## 0. Contrainte fondamentale — Créneaux autorisés

L'école fonctionne **exclusivement** sur les 5 demi-journées suivantes :

| Créneau | Jour | Période |
|---|---|---|
| MERCREDI_PM | Mercredi | Après-midi |
| SAMEDI_AM | Samedi | Matin |
| SAMEDI_PM | Samedi | Après-midi |
| DIMANCHE_AM | Dimanche | Matin |
| DIMANCHE_PM | Dimanche | Après-midi |

**Règle absolue** : aucun cours, aucun appel, aucun contenu de cours ne peut être créé en dehors de ces 5 créneaux. Cette contrainte est imposée au niveau du schéma de données (enum `TimeSlot`) et validée côté serveur.

---

## 1. Règles sur les élèves

### Inscription
- **Matricule** : généré automatiquement au format `ECO-{ANNEE}-{SEQUENCE}` (ex: ECO-2026-0001). Non modifiable après création.
- **Statut par défaut** : `INSCRIT` à la création.
- **Unicité** : un élève est identifié par son matricule (unique par école).
- **Classe obligatoire** : un élève doit être affecté à une classe à l'inscription.
- **Capacité** : l'inscription est bloquée si la classe a atteint sa capacité maximale (`enrolledCount >= capacity`). Message : "Cette classe est complète. Veuillez choisir une autre classe ou augmenter la capacité."
- **Genre de classe** : si la classe est FILLE, seules les élèves de genre FEMALE peuvent y être inscrites. Si GARCON, seuls les MALE. Si MIXTE, tous les genres sont acceptés.

### Radiation
- Un élève radié (`RADIE`) reste dans la base avec son historique.
- Un élève radié n'apparaît plus dans les listes par défaut (filtre `status != RADIE`).
- Un élève radié ne peut plus être appelé en classe.
- La radiation est réversible (passage de RADIE à INSCRIT).

### Suppression
- Un élève ne peut être supprimé que s'il n'a aucune donnée associée (absences, notes futures...).
- On privilégie la radiation à la suppression.

---

## 2. Règles sur les parents

### Compte utilisateur et invitation
- Chaque parent a un compte `User` avec le rôle `PARENT`.
- L'email du parent est son identifiant de connexion.
- **Unicité email** : deux parents ne peuvent pas avoir le même email dans la même école.
- **Workflow d'invitation** :
  1. L'admin crée le parent → un compte User est créé avec `passwordHash = NULL` et un `inviteToken` généré.
  2. Un email d'invitation est envoyé au parent avec un lien contenant le token.
  3. Le parent clique sur le lien et définit son mot de passe.
  4. Le token est supprimé, le compte passe en statut "actif".
  5. L'admin peut renvoyer l'invitation à tout moment si le parent n'a pas encore activé son compte.
- **Le mot de passe n'est jamais défini par l'admin** — uniquement par le parent via le lien d'invitation.

### Liaisons parent-élève
- Un parent peut être lié à **1 ou plusieurs** élèves (fratrie).
- Un élève peut être lié à **1 ou 2** parents/responsables maximum.
- Chaque liaison porte une relation (PERE, MERE, TUTEUR, AUTRE).
- **Un seul contact principal** par élève : `isPrimaryContact = true` pour un seul parent par élève.

### Ajout frère/sœur
- Depuis la fiche d'un élève, "Ajouter frère/sœur" crée un nouvel élève pré-lié aux mêmes parents.
- L'adresse est pré-remplie depuis le parent.

---

## 3. Règles sur les classes

### Création
- Le libellé de la classe doit être unique par école et par année scolaire.
- Le type de période (TRIMESTRE par défaut, SEMESTRE, BIMESTRE, PERIODE) est défini à la création et s'applique à toute la classe.

### Professeur attitré
- **1 classe = 1 professeur attitré pour toute l'année scolaire.**
- Le professeur enseigne TOUTES les matières à sa classe (pas de rotation de profs par matière).
- Un professeur peut être attitré à PLUSIEURS classes, mais sur des créneaux différents.
- **Validation** : un professeur ne peut pas être assigné à 2 classes sur le même créneau (conflit d'emploi du temps).
- Le champ `mainTeacherId` sur ClassGroup est optionnel à la création (peut être assigné ultérieurement).

### Genre de la classe
- Trois options : **FILLE**, **GARCON**, **MIXTE**.
- **Défaut : GARCON** (les classes non mixtes sont la norme dans les écoles arabes/coraniques).
- Validation à l'inscription d'un élève :
  - Classe FILLE → seuls les élèves `gender = FEMALE`
  - Classe GARCON → seuls les élèves `gender = MALE`
  - Classe MIXTE → tous les élèves

### Capacité et remplissage
- **Taux de remplissage** = `(nombre d'élèves inscrits / capacité) × 100`
- Codes couleur :
  - Vert : < 80%
  - Orange : 80% - 95%
  - Rouge : > 95%
  - Bloqué : 100% (plus d'inscription possible)

### Suppression
- Une classe ne peut être supprimée que si elle ne contient **aucun élève inscrit**.
- Si des élèves sont présents : message "Veuillez d'abord transférer ou radier les élèves de cette classe."

---

## 4. Règles sur les niveaux

### Création
- Le code du niveau est unique par école. Texte libre.
- Le libellé est un texte libre (ex: "Tajwid avancé", "Coran N1", "Mémorisation Juz Amma").
- L'ordre détermine le tri dans les listes et sélecteurs.

### Agrégations
- **Nombre de places** = somme des capacités de toutes les classes de ce niveau.
- **Élèves inscrits** = somme des élèves de toutes les classes de ce niveau.
- **Taux de remplissage** = (inscrits / places) × 100.
- **Nombre de classes** = COUNT des classes rattachées.

### Suppression
- Un niveau ne peut être supprimé que s'il ne contient **aucune classe**.

---

## 5. Règles sur les matières

### Création
- Le code de la matière est unique par école. Texte libre.
- Le libellé est un texte libre (ex: "Coran", "Tajwid", "Arabe - Grammaire", "Sira").
- Les heures à planifier sont en décimal (ex: 1.5 = 1h30).
- Le volume horaire total disponible par semaine est limité à ~15h (5 demi-journées × ~3h chacune).

### Suivi horaire
- **Heures planifiées** = somme des durées des créneaux d'emploi du temps utilisant cette matière.
- **Écart** = heures à planifier - heures planifiées.
- Indicateur visuel :
  - Vert : écart = 0 (parfait)
  - Orange : écart > 0 (sous-planifié)
  - Rouge : écart < 0 (sur-planifié)

### Suppression
- Une matière ne peut être supprimée que si elle n'est référencée dans aucun créneau, contenu de cours ou devoir.

---

## 6. Règles sur l'appel (Attendance)

### Contrainte de créneaux
- Un appel ne peut être créé que pour un créneau autorisé (enum `TimeSlot` : MERCREDI_PM, SAMEDI_AM, SAMEDI_PM, DIMANCHE_AM, DIMANCHE_PM).
- La date de l'appel doit correspondre au bon jour de la semaine (mercredi, samedi ou dimanche).

### Processus d'appel
1. L'utilisateur ouvre la modale d'appel pour un cours donné (classe + créneau + date).
2. Tous les élèves de la classe apparaissent avec le statut `PRESENT` par défaut.
3. L'utilisateur marque les absents, retards et excusés.
4. Si le statut est `ABSENT` ou `RETARD`, un champ "motif" apparaît (optionnel).
5. Validation : l'appel est enregistré.

### Unicité
- Un seul appel par créneau/élève/date. Si un appel existe déjà, il est modifiable (pas de doublon).

### Retards
- Un retard de plus de **15 minutes** est automatiquement comptabilisé comme une absence.
- Seuil fixe à 15 minutes en v0.1. À rendre configurable par école en v0.2.

### Règle fondamentale : 1 élève = 1 classe = 1 créneau/semaine
- Chaque classe dispose d'**un seul créneau hebdomadaire fixe** (un TimeSlot parmi les 5 possibles).
- Un élève appartient à une seule classe, donc il vient **une seule fois par semaine**, au créneau de sa classe.
- Conséquence directe : **1 absence = l'élève a raté son unique créneau de la semaine**.

### Calcul des absences simplifié
- Le champ `halfDay` utilise l'enum `TimeSlot` — il est déterminé automatiquement à l'enregistrement selon le créneau du cours.
- Puisqu'un élève n'a qu'un seul créneau par semaine, le calcul est direct : chaque absence = 1 semaine manquée.
- **Maximum théorique** : 1 absence par semaine, ~4 par mois.

### Alertes
- **Seuil d'alerte** : 4 absences non justifiées sur le mois en cours (= l'élève a été absent 4 semaines sur ~4-5 semaines du mois).
- Seuil fixe en v0.1 (4). À rendre configurable par école via settings en v0.2.
- Les élèves atteignant ce seuil apparaissent sur le tableau de bord dans la zone "Alertes".
- Badge rouge avec le nombre exact d'absences.

### Justification
- Une absence peut être marquée comme "justifiée" après coup par un admin/directeur.
- Les absences justifiées ne comptent pas dans le seuil d'alerte.

---

## 7. Règles sur le contenu de cours

### Saisie
- Le contenu est lié à une date, un professeur, une matière et une classe.
- **La date doit tomber un mercredi, samedi ou dimanche** — validation côté serveur.
- Le créneau (TimeSlot) est automatiquement déterminé ou sélectionné parmi les créneaux autorisés.
- Le niveau est déduit automatiquement de la classe sélectionnée.

### Permissions
- Un professeur ne peut saisir du contenu que pour **ses propres cours** (classes/matières auxquelles il est affecté).
- Admin et directeur peuvent saisir/modifier pour n'importe quel cours.

### Historique
- Les contenus de cours ne peuvent pas être supprimés par un professeur, uniquement par un admin/directeur.
- La modification est possible dans les 7 jours suivant la création (par les professeurs). Admin peut toujours modifier.

---

## 8. Règles sur les devoirs

### Saisie
- Mêmes règles de permission que le contenu de cours.
- La date limite est obligatoire et doit être postérieure à la date de création.
- **La date limite doit tomber un jour de cours** (mercredi, samedi ou dimanche) pour que les élèves puissent rendre le devoir en classe.

### Statut calculé
- **À venir** : `dueDate > today + 2 jours`
- **En cours** : `today <= dueDate <= today + 2 jours`
- **Passé** : `dueDate < today`

### Affichage
- Les devoirs passés restent visibles mais sont grisés.
- Tri par défaut : date limite croissante (prochains devoirs en premier).
- Les devoirs passés depuis plus de 30 jours sont masqués par défaut (filtre).

---

## 9. Règles d'export

### Formats supportés
- **CSV** : via papaparse, encodage UTF-8 avec BOM pour Excel
- **Excel** : via xlsx, avec mise en forme basique (en-têtes en gras)
- **PDF** : via jsPDF, avec logo de l'école, titre, date de génération

### Contenu exporté
- L'export contient les données **filtrées** (si un filtre est actif, seules les données filtrées sont exportées).
- Colonnes exportées = colonnes visibles dans la table.

### Permissions
- Export disponible pour : ADMIN, DIRECTEUR.
- PROFESSEUR : export limité à ses propres classes.
- PERSONNEL, PARENT : pas d'export.

---

## 10. Règles de validation (Zod)

### Champs texte
- Nom, prénom : min 2 caractères, max 100 caractères, pas de chiffres.
- Email : format email valide.
- Téléphone : format international ou local (à adapter par pays).

### Dates
- Date de naissance : entre il y a 25 ans et il y a 2 ans (âge scolaire).
- Date d'inscription : ne peut pas être dans le futur de plus de 6 mois.
- Date limite devoir : doit être dans le futur et tomber un mercredi, samedi ou dimanche.
- Date contenu de cours : doit tomber un mercredi, samedi ou dimanche.

### Nombres
- Capacité classe : min 1, max 100.
- Heures matière : min 0.5, max 15 (max théorique = 5 demi-journées × 3h).
- Ordre niveau : min 1.

---

## 11. Suppression en cascade vs protection

| Entité | Comportement à la suppression |
|---|---|
| School | CASCADE (supprime tout — opération super admin uniquement) |
| AcademicYear | PROTECT si des classes existent |
| Level | PROTECT si des classes existent |
| ClassGroup | PROTECT si des élèves existent |
| Student | PROTECT si des absences existent (préférer radiation) |
| Parent | PROTECT si des enfants sont liés |
| Subject | PROTECT si utilisée dans Schedule/CourseContent/Homework |
| Teacher | PROTECT si affecté à des créneaux |
| Schedule | CASCADE sur Attendance liée |
| CourseContent | Suppression directe autorisée (admin) |
| Homework | Suppression directe autorisée (admin) |
| Attendance | Suppression directe autorisée (admin) |

---

## 12. Communication — Placeholders v0.1

Les fonctionnalités de communication sont reportées à une phase ultérieure dédiée. En v0.1 :
- Bouton **"Contacter"** (fiche élève) → toast "Messagerie bientôt disponible"
- Bouton **"Contacter parents"** (fiche élève) → toast "Messagerie bientôt disponible"
- Bouton **"Discussion"** (fiche parent) → toast "Messagerie bientôt disponible"
- Les boutons restent visibles mais inactifs, pour que l'utilisateur comprenne que la fonctionnalité est prévue.
