# Modèle de données — EcoleGestion

## Résumé

Ce document décrit toutes les entités, leurs champs, types et relations pour le module Vie scolaire. Le schéma est conçu pour être multi-tenant (isolé par école) et extensible pour les modules futurs.

**Contexte** : école arabe/coranique, calendrier mercredi PM / samedi / dimanche uniquement, classes non mixtes majoritaires, niveaux et matières libres.

## Diagramme des relations

```
School (tenant)
  ├── User (auth, rôles)
  ├── Level (niveaux — libres)
  │     └── ClassGroup (classes — genre FILLE/GARCON/MIXTE)
  │           ├── Student (élèves)
  │           ├── Schedule (emploi du temps — 5 créneaux/semaine)
  │           ├── CourseContent (contenu de cours)
  │           ├── Homework (devoirs)
  │           └── Attendance (appel/présence)
  ├── Subject (matières — libres)
  ├── Teacher (professeurs) → lié à User
  ├── Parent (parents) → lié à User
  │     └── StudentParent (liaison parent-élève)
  └── AcademicYear (année scolaire)
```

## Entités détaillées

---

### School (École / Tenant)

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK, auto | Identifiant unique |
| name | String | NOT NULL | Nom de l'école |
| code | String | UNIQUE, NOT NULL | Code court (ex: ECO-001) |
| address | String | | Adresse postale |
| phone | String | | Téléphone |
| email | String | | Email de contact |
| logo | String | | URL du logo |
| country | String | NOT NULL | Pays |
| timezone | String | NOT NULL | Fuseau horaire |
| createdAt | DateTime | auto | Date de création |
| updatedAt | DateTime | auto | Date de mise à jour |

---

### AcademicYear (Année scolaire)

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK | |
| schoolId | UUID | FK → School | |
| label | String | NOT NULL | Ex: "2025-2026" |
| startDate | Date | NOT NULL | Début de l'année |
| endDate | Date | NOT NULL | Fin de l'année |
| isCurrent | Boolean | default false | Année active |
| createdAt | DateTime | auto | |

**Règle** : une seule année peut avoir `isCurrent = true` par école.

---

### User (Utilisateur / Authentification)

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK | |
| schoolId | UUID | FK → School, NULLABLE | NULL pour SUPER_ADMIN |
| email | String | UNIQUE, NOT NULL | Identifiant de connexion |
| passwordHash | String | NULLABLE | NULL si invitation en attente |
| role | Enum | NOT NULL | SUPER_ADMIN, ADMIN, DIRECTEUR, PROFESSEUR, PERSONNEL, PARENT |
| firstName | String | NOT NULL | |
| lastName | String | NOT NULL | |
| isActive | Boolean | default true | Compte actif/désactivé |
| inviteToken | String | NULLABLE | Token d'invitation (parents) |
| inviteExpiresAt | DateTime | NULLABLE | Expiration du token |
| lastLoginAt | DateTime | | Dernière connexion |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Index** : `(schoolId, email)` unique.

**Workflow invitation parent** : à la création, `passwordHash` est NULL et `inviteToken` est généré. Le parent reçoit un email avec un lien pour définir son mot de passe. Une fois le mot de passe défini, `inviteToken` est supprimé.

---

### Teacher (Professeur)

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK | |
| userId | UUID | FK → User, UNIQUE | Lien vers le compte utilisateur |
| schoolId | UUID | FK → School | |
| phone | String | | Téléphone |
| specialization | String | | Spécialité principale (ex: Tajwid, Coran, Arabe) |
| hireDate | Date | | Date d'embauche |
| isActive | Boolean | default true | |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Relations** : Un Teacher enseigne plusieurs Subject (table de liaison `TeacherSubject`).

---

### TeacherSubject (Liaison Professeur-Matière)

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK | |
| teacherId | UUID | FK → Teacher | |
| subjectId | UUID | FK → Subject | |

**Index unique** : `(teacherId, subjectId)`.

---

### Level (Niveau de classe)

Niveaux totalement libres et personnalisables. Pas de niveaux standards imposés.

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK | |
| schoolId | UUID | FK → School | |
| label | String | NOT NULL | Texte libre (ex: "Tajwid avancé", "Coran N1", "Arabe A2") |
| code | String | NOT NULL | Code court libre (ex: "TAJ-AV", "COR-1", "AR-A2") |
| order | Int | NOT NULL | Ordre d'affichage |
| description | String | | |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Index unique** : `(schoolId, code)`.

---

### ClassGroup (Classe)

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK | |
| schoolId | UUID | FK → School | |
| levelId | UUID | FK → Level | |
| academicYearId | UUID | FK → AcademicYear | |
| label | String | NOT NULL | Ex: "Coran N1 - Garçons", "Tajwid - Filles A" |
| classGender | Enum | NOT NULL, default GARCON | FILLE, GARCON, MIXTE |
| periodType | Enum | NOT NULL, default TRIMESTRE | TRIMESTRE, SEMESTRE, BIMESTRE, PERIODE |
| capacity | Int | NOT NULL | Nombre de places |
| room | String | | Salle principale |
| mainTeacherId | UUID | FK → Teacher, NULLABLE | Professeur principal |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Index unique** : `(schoolId, academicYearId, label)`.

**Champs calculés** (non stockés) :
- `enrolledCount` : COUNT des étudiants liés
- `fillRate` : (enrolledCount / capacity) × 100

**Changements vs v0 de la doc** :
- Suppression de `isMixed` + `genderRestriction` au profit d'un champ unique `classGender` (enum FILLE/GARCON/MIXTE)
- Défaut à GARCON (non mixte par défaut, conforme au contexte)
- Défaut `periodType` à TRIMESTRE

---

### Student (Élève)

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK | |
| schoolId | UUID | FK → School | |
| classGroupId | UUID | FK → ClassGroup | |
| matricule | String | UNIQUE, NOT NULL | Auto-généré : ECO-AAAA-XXXX |
| gender | Enum | NOT NULL | MALE, FEMALE |
| firstName | String | NOT NULL | |
| lastName | String | NOT NULL | |
| dateOfBirth | Date | NOT NULL | |
| placeOfBirth | String | | |
| nationality | String | | |
| address | String | | |
| photo | String | | URL Supabase Storage (bucket photos-eleves) |
| status | Enum | NOT NULL, default INSCRIT | INSCRIT, EN_ATTENTE, RADIE |
| enrollmentDate | Date | NOT NULL | Date d'inscription |
| observations | String | | Notes internes |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Index** : `(schoolId, matricule)` unique, `(schoolId, classGroupId)`, `(schoolId, lastName, firstName)`.

---

### Parent

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK | |
| userId | UUID | FK → User, UNIQUE | Lien vers le compte utilisateur |
| schoolId | UUID | FK → School | |
| gender | Enum | NOT NULL | MALE, FEMALE |
| firstName | String | NOT NULL | |
| lastName | String | NOT NULL | |
| email | String | NOT NULL | = User.email |
| phone | String | NOT NULL | Téléphone principal |
| phoneSecondary | String | | Téléphone secondaire |
| address | String | | |
| profession | String | | |
| observations | String | | |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

---

### StudentParent (Liaison Élève-Parent)

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK | |
| studentId | UUID | FK → Student | |
| parentId | UUID | FK → Parent | |
| relationship | Enum | NOT NULL | PERE, MERE, TUTEUR, AUTRE |
| isPrimaryContact | Boolean | default false | Contact principal |

**Index unique** : `(studentId, parentId)`.

---

### Subject (Matière)

Matières totalement libres, adaptées à l'enseignement arabe/coranique.

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK | |
| schoolId | UUID | FK → School | |
| label | String | NOT NULL | Texte libre (ex: "Coran", "Tajwid", "Arabe - Grammaire") |
| code | String | NOT NULL | Code court libre (ex: "COR", "TAJ", "AR-GR") |
| weeklyHours | Decimal | NOT NULL | Heures à planifier par semaine (sur 5 demi-journées max) |
| description | String | | |
| color | String | | Code couleur hex |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Index unique** : `(schoolId, code)`.

---

### Schedule (Créneau d'emploi du temps)

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK | |
| schoolId | UUID | FK → School | |
| academicYearId | UUID | FK → AcademicYear | |
| classGroupId | UUID | FK → ClassGroup | |
| subjectId | UUID | FK → Subject | |
| teacherId | UUID | FK → Teacher | |
| timeSlot | Enum | NOT NULL | MERCREDI_PM, SAMEDI_AM, SAMEDI_PM, DIMANCHE_AM, DIMANCHE_PM |
| startTime | String | NOT NULL | Format "HH:MM" |
| endTime | String | NOT NULL | Format "HH:MM" |
| room | String | | Salle |
| createdAt | DateTime | auto | |

**Index unique** : `(classGroupId, timeSlot, startTime)` (pas de chevauchement par classe et créneau).

**Changement majeur** : `dayOfWeek` (Int 1-5) remplacé par `timeSlot` (enum des 5 créneaux autorisés). Cela empêche structurellement toute création de cours en dehors des jours autorisés.

---

### CourseContent (Contenu de cours)

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK | |
| schoolId | UUID | FK → School | |
| scheduleId | UUID | FK → Schedule, NULLABLE | Créneau lié |
| classGroupId | UUID | FK → ClassGroup | |
| subjectId | UUID | FK → Subject | |
| teacherId | UUID | FK → Teacher | |
| date | Date | NOT NULL | Doit tomber un mercredi, samedi ou dimanche |
| timeSlot | Enum | NULLABLE | Si pas lié à un Schedule |
| startTime | String | | Si pas lié à un schedule |
| endTime | String | | |
| content | Text | NOT NULL | Description du contenu |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

---

### Homework (Devoir)

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK | |
| schoolId | UUID | FK → School | |
| classGroupId | UUID | FK → ClassGroup | |
| subjectId | UUID | FK → Subject | |
| teacherId | UUID | FK → Teacher | |
| createdDate | Date | NOT NULL | Date de création |
| dueDate | Date | NOT NULL | Date limite (doit tomber un jour de cours) |
| description | Text | NOT NULL | Énoncé du devoir |
| attachmentUrl | String | | URL Supabase Storage (bucket pieces-jointes-devoirs) |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Champ calculé** :
- `status` : À_VENIR (dueDate > today + 2), EN_COURS (dueDate dans les 2 prochains jours), PASSE (dueDate < today)

---

### Attendance (Présence / Appel)

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK | |
| schoolId | UUID | FK → School | |
| scheduleId | UUID | FK → Schedule | Créneau concerné |
| studentId | UUID | FK → Student | |
| date | Date | NOT NULL | Doit tomber un mercredi, samedi ou dimanche |
| status | Enum | NOT NULL | PRESENT, ABSENT, RETARD, EXCUSE |
| reason | String | | Motif (si absent/retard) |
| isJustified | Boolean | default false | Absence justifiée |
| halfDay | Enum | NOT NULL | MERCREDI_PM, SAMEDI_AM, SAMEDI_PM, DIMANCHE_AM, DIMANCHE_PM |
| recordedById | UUID | FK → User | Qui a fait l'appel |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Index unique** : `(scheduleId, studentId, date)`.

**Changement** : `halfDay` utilise désormais le même enum `TimeSlot` que Schedule, rendant le calcul de demi-journées d'absence direct et sans ambiguïté. Maximum 5 demi-journées par semaine.

---

## Schéma Prisma proposé

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  DIRECTEUR
  PROFESSEUR
  PERSONNEL
  PARENT
}

enum Gender {
  MALE
  FEMALE
}

enum ClassGender {
  FILLE
  GARCON
  MIXTE
}

enum StudentStatus {
  INSCRIT
  EN_ATTENTE
  RADIE
}

enum PeriodType {
  TRIMESTRE
  SEMESTRE
  BIMESTRE
  PERIODE
}

enum TimeSlot {
  MERCREDI_PM
  SAMEDI_AM
  SAMEDI_PM
  DIMANCHE_AM
  DIMANCHE_PM
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  RETARD
  EXCUSE
}

enum Relationship {
  PERE
  MERE
  TUTEUR
  AUTRE
}

model School {
  id        String   @id @default(uuid())
  name      String
  code      String   @unique
  address   String?
  phone     String?
  email     String?
  logo      String?
  country   String
  timezone  String   @default("Europe/Paris")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users          User[]
  academicYears  AcademicYear[]
  levels         Level[]
  classGroups    ClassGroup[]
  students       Student[]
  parents        Parent[]
  teachers       Teacher[]
  subjects       Subject[]
  schedules      Schedule[]
  courseContents CourseContent[]
  homeworks      Homework[]
  attendances    Attendance[]
}

model AcademicYear {
  id        String   @id @default(uuid())
  schoolId  String
  label     String
  startDate DateTime
  endDate   DateTime
  isCurrent Boolean  @default(false)
  createdAt DateTime @default(now())

  school      School       @relation(fields: [schoolId], references: [id])
  classGroups ClassGroup[]

  @@unique([schoolId, label])
}

model User {
  id              String    @id @default(uuid())
  schoolId        String?
  email           String
  passwordHash    String?
  role            UserRole
  firstName       String
  lastName        String
  isActive        Boolean   @default(true)
  inviteToken     String?   @unique
  inviteExpiresAt DateTime?
  lastLoginAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  school      School?      @relation(fields: [schoolId], references: [id])
  teacher     Teacher?
  parent      Parent?
  attendances Attendance[] @relation("RecordedBy")

  @@unique([schoolId, email])
}

model Teacher {
  id             String    @id @default(uuid())
  userId         String    @unique
  schoolId       String
  phone          String?
  specialization String?
  hireDate       DateTime?
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  user           User             @relation(fields: [userId], references: [id])
  school         School           @relation(fields: [schoolId], references: [id])
  subjects       TeacherSubject[]
  classGroups    ClassGroup[]     @relation("MainTeacher")
  schedules      Schedule[]
  courseContents CourseContent[]
  homeworks      Homework[]
}

model TeacherSubject {
  id        String @id @default(uuid())
  teacherId String
  subjectId String

  teacher Teacher @relation(fields: [teacherId], references: [id])
  subject Subject @relation(fields: [subjectId], references: [id])

  @@unique([teacherId, subjectId])
}

model Level {
  id          String   @id @default(uuid())
  schoolId    String
  label       String
  code        String
  order       Int
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  school      School       @relation(fields: [schoolId], references: [id])
  classGroups ClassGroup[]

  @@unique([schoolId, code])
}

model ClassGroup {
  id             String      @id @default(uuid())
  schoolId       String
  levelId        String
  academicYearId String
  label          String
  classGender    ClassGender @default(GARCON)
  periodType     PeriodType  @default(TRIMESTRE)
  capacity       Int
  room           String?
  mainTeacherId  String?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  school         School          @relation(fields: [schoolId], references: [id])
  level          Level           @relation(fields: [levelId], references: [id])
  academicYear   AcademicYear    @relation(fields: [academicYearId], references: [id])
  mainTeacher    Teacher?        @relation("MainTeacher", fields: [mainTeacherId], references: [id])
  students       Student[]
  schedules      Schedule[]
  courseContents CourseContent[]
  homeworks      Homework[]

  @@unique([schoolId, academicYearId, label])
}

model Student {
  id             String        @id @default(uuid())
  schoolId       String
  classGroupId   String
  matricule      String
  gender         Gender
  firstName      String
  lastName       String
  dateOfBirth    DateTime
  placeOfBirth   String?
  nationality    String?
  address        String?
  photo          String?
  status         StudentStatus @default(INSCRIT)
  enrollmentDate DateTime
  observations   String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  school      School          @relation(fields: [schoolId], references: [id])
  classGroup  ClassGroup      @relation(fields: [classGroupId], references: [id])
  parents     StudentParent[]
  attendances Attendance[]

  @@unique([schoolId, matricule])
  @@index([schoolId, classGroupId])
  @@index([schoolId, lastName, firstName])
}

model Parent {
  id             String   @id @default(uuid())
  userId         String   @unique
  schoolId       String
  gender         Gender
  firstName      String
  lastName       String
  email          String
  phone          String
  phoneSecondary String?
  address        String?
  profession     String?
  observations   String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user     User            @relation(fields: [userId], references: [id])
  school   School          @relation(fields: [schoolId], references: [id])
  children StudentParent[]

  @@index([schoolId, email])
}

model StudentParent {
  id               String       @id @default(uuid())
  studentId        String
  parentId         String
  relationship     Relationship
  isPrimaryContact Boolean      @default(false)

  student Student @relation(fields: [studentId], references: [id])
  parent  Parent  @relation(fields: [parentId], references: [id])

  @@unique([studentId, parentId])
}

model Subject {
  id          String   @id @default(uuid())
  schoolId    String
  label       String
  code        String
  weeklyHours Decimal
  description String?
  color       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  school         School           @relation(fields: [schoolId], references: [id])
  teachers       TeacherSubject[]
  schedules      Schedule[]
  courseContents CourseContent[]
  homeworks      Homework[]

  @@unique([schoolId, code])
}

model Schedule {
  id             String   @id @default(uuid())
  schoolId       String
  academicYearId String
  classGroupId   String
  subjectId      String
  teacherId      String
  timeSlot       TimeSlot
  startTime      String   // Format "HH:MM"
  endTime        String   // Format "HH:MM"
  room           String?
  createdAt      DateTime @default(now())

  school         School          @relation(fields: [schoolId], references: [id])
  classGroup     ClassGroup      @relation(fields: [classGroupId], references: [id])
  subject        Subject         @relation(fields: [subjectId], references: [id])
  teacher        Teacher         @relation(fields: [teacherId], references: [id])
  attendances    Attendance[]
  courseContents CourseContent[]

  @@unique([classGroupId, timeSlot, startTime])
}

model CourseContent {
  id           String    @id @default(uuid())
  schoolId     String
  scheduleId   String?
  classGroupId String
  subjectId    String
  teacherId    String
  date         DateTime
  timeSlot     TimeSlot?
  startTime    String?
  endTime      String?
  content      String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  school     School     @relation(fields: [schoolId], references: [id])
  schedule   Schedule?  @relation(fields: [scheduleId], references: [id])
  classGroup ClassGroup @relation(fields: [classGroupId], references: [id])
  subject    Subject    @relation(fields: [subjectId], references: [id])
  teacher    Teacher    @relation(fields: [teacherId], references: [id])
}

model Homework {
  id            String   @id @default(uuid())
  schoolId      String
  classGroupId  String
  subjectId     String
  teacherId     String
  createdDate   DateTime
  dueDate       DateTime
  description   String
  attachmentUrl String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  school     School     @relation(fields: [schoolId], references: [id])
  classGroup ClassGroup @relation(fields: [classGroupId], references: [id])
  subject    Subject    @relation(fields: [subjectId], references: [id])
  teacher    Teacher    @relation(fields: [teacherId], references: [id])
}

model Attendance {
  id           String           @id @default(uuid())
  schoolId     String
  scheduleId   String
  studentId    String
  date         DateTime
  status       AttendanceStatus
  reason       String?
  isJustified  Boolean          @default(false)
  halfDay      TimeSlot
  recordedById String
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  school     School   @relation(fields: [schoolId], references: [id])
  schedule   Schedule @relation(fields: [scheduleId], references: [id])
  student    Student  @relation(fields: [studentId], references: [id])
  recordedBy User     @relation("RecordedBy", fields: [recordedById], references: [id])

  @@unique([scheduleId, studentId, date])
}
```

## Notes sur le modèle

1. **Multi-tenant** : toutes les tables métier portent `schoolId`. Les requêtes sont systématiquement filtrées.
2. **Année scolaire** : les classes sont liées à une année scolaire, permettant l'historique.
3. **Séparation User/Teacher/Parent** : `User` gère l'authentification, `Teacher` et `Parent` portent les données métier. Un User peut être Teacher OU Parent, jamais les deux.
4. **Matricule auto-généré** : format `ECO-AAAA-XXXX` où AAAA = année et XXXX = compteur séquentiel.
5. **Horaires en String** : les créneaux utilisent le format "HH:MM" car PostgreSQL gère mal le type `Time` seul via Prisma.
6. **Champs calculés** : taux de remplissage, statut des devoirs, nombre de demi-journées d'absence sont calculés à la requête, pas stockés.
7. **TimeSlot enum** : remplace `dayOfWeek` (Int) et `HalfDay` (MATIN/APRES_MIDI). Les 5 créneaux autorisés (MERCREDI_PM, SAMEDI_AM, SAMEDI_PM, DIMANCHE_AM, DIMANCHE_PM) sont imposés au niveau du schéma — impossible de créer un cours un lundi ou un vendredi.
8. **ClassGender enum** : remplace `isMixed` + `genderRestriction`. Trois valeurs claires : FILLE, GARCON, MIXTE. Défaut à GARCON.
9. **Invitation parents** : `User.passwordHash` est nullable (NULL = invitation en attente). `inviteToken` + `inviteExpiresAt` gèrent le workflow d'invitation par email.
10. **Stockage fichiers** : les URL de photos et pièces jointes pointent vers Supabase Storage (buckets : photos-eleves, pieces-jointes-devoirs, documents-administratifs).
