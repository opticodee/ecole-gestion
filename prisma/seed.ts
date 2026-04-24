import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashSync } from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const connectionString = process.env['DIRECT_URL'] || process.env['DATABASE_URL'];
if (!connectionString) throw new Error('Missing DATABASE_URL or DIRECT_URL');

const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

// =====================================================
// HELPERS
// =====================================================

function date(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d);
}

function randomPhone(): string {
  const prefix = ['06', '07'][Math.floor(Math.random() * 2)];
  const digits = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
  return `${prefix}${digits}`;
}

function emailFrom(firstName: string, lastName: string, domain?: string): string {
  const f = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  const l = lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  const d = domain ?? ['gmail.com', 'outlook.fr', 'yahoo.fr', 'hotmail.fr'][Math.floor(Math.random() * 4)];
  return `${f}.${l}@${d}`;
}

/** Returns past course dates matching a specific TimeSlot within the last N weeks */
function getCourseDatesForSlot(
  timeSlot: string,
  weeksBack: number,
): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Map TimeSlot to day of week (0=Sun, 3=Wed, 6=Sat)
  const slotDay: Record<string, number> = {
    MERCREDI_PM: 3,
    SAMEDI_AM: 6,
    SAMEDI_PM: 6,
    DIMANCHE_AM: 0,
    DIMANCHE_PM: 0,
  };

  const targetDay = slotDay[timeSlot];
  if (targetDay === undefined) return dates;

  for (let i = 1; i <= weeksBack * 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (d.getDay() === targetDay) {
      dates.push(d);
    }
  }
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

const PASSWORD_HASH = hashSync('ChangeMe2026!', 10);

// =====================================================
// DATA DEFINITIONS
//
// NOTE : Les niveaux et matières ci-dessous sont des EXEMPLES
// adaptés à une école coranique typique. L'administrateur pourra
// les modifier, supprimer ou en créer de nouveaux via l'interface.
// =====================================================

const LEVELS = [
  { label: 'Débutant', code: 'DEB', order: 1, description: 'Pour les plus jeunes (6-7 ans), découverte de l\'alphabet arabe et sourates courtes' },
  { label: 'Coran Niveau 1', code: 'COR-1', order: 2, description: 'Lecture de base du Coran, apprentissage du déchiffrage' },
  { label: 'Coran Niveau 2', code: 'COR-2', order: 3, description: 'Lecture fluide du Coran, travail sur la prononciation' },
  { label: 'Tajwid Initiation', code: 'TAJ-INIT', order: 4, description: 'Règles fondamentales du Tajwid' },
  { label: 'Arabe A1', code: 'AR-A1', order: 5, description: 'Langue arabe niveau débutant : lecture, écriture, vocabulaire de base' },
  { label: 'Mémorisation Juz Amma', code: 'MEM-JA', order: 6, description: 'Mémorisation du 30ème Juz (Juz Amma)' },
];

// NOTE : Matières et sous-matières librement modifiables par l'admin via l'interface.
// Hiérarchie : matière parent → sous-matières. parentCode = null pour les matières de premier niveau.
interface SubjectDef {
  label: string;
  code: string;
  parentCode: string | null;
  weeklyHours: number;
  color?: string;
  description?: string;
}

const SUBJECTS: SubjectDef[] = [
  // Général
  { label: 'Général', code: 'GEN', parentCode: null, weeklyHours: 1, color: '#64748B', description: 'Matière générale' },

  // Langue arabe + sous-matières
  { label: 'Langue arabe', code: 'AR', parentCode: null, weeklyHours: 2, color: '#059669', description: 'Langue arabe : lecture, écriture, grammaire et expression' },
  { label: 'Copie', code: 'AR-COPIE', parentCode: 'AR', weeklyHours: 0.5, description: 'Exercices de copie en arabe' },
  { label: 'Dictée', code: 'AR-DICTEE', parentCode: 'AR', weeklyHours: 0.5, description: 'Dictée en arabe' },
  { label: 'Écriture', code: 'AR-ECRITURE', parentCode: 'AR', weeklyHours: 0.5, description: 'Écriture des lettres et mots arabes' },
  { label: 'Expression écrite', code: 'AR-EXPR-ECR', parentCode: 'AR', weeklyHours: 0.5, description: 'Rédaction en arabe' },
  { label: 'Expression orale', code: 'AR-EXPR-ORA', parentCode: 'AR', weeklyHours: 0.5, description: 'Expression orale en arabe' },
  { label: 'Grammaire et conjugaison', code: 'AR-GRAM', parentCode: 'AR', weeklyHours: 0.5, description: 'Règles de grammaire et conjugaison arabe' },
  { label: 'Lecture', code: 'AR-LEC', parentCode: 'AR', weeklyHours: 0.5, description: 'Lecture en arabe' },

  // Comportement
  { label: 'Comportement', code: 'COMP', parentCode: null, weeklyHours: 0.5, color: '#D97706', description: 'Éducation au comportement' },

  // Éducation musulmane + sous-matières
  { label: 'Éducation musulmane', code: 'EDM', parentCode: null, weeklyHours: 1.5, color: '#4F46E5', description: 'Éducation religieuse et spirituelle' },
  { label: 'Adoration', code: 'EDM-ADO', parentCode: 'EDM', weeklyHours: 0.5, description: 'Adoration et pratiques cultuelles' },
  { label: 'Éducation civique', code: 'EDM-CIV', parentCode: 'EDM', weeklyHours: 0.5, description: 'Citoyenneté et valeurs' },
  { label: 'Éveil à la foi', code: 'EDM-FOI', parentCode: 'EDM', weeklyHours: 0.5, description: 'Éveil spirituel des plus jeunes' },
  { label: 'Histoire des prophètes', code: 'EDM-HIS', parentCode: 'EDM', weeklyHours: 0.5, description: 'Histoire des prophètes' },

  // Coran + sous-matière
  { label: 'Coran', code: 'COR', parentCode: null, weeklyHours: 3, color: '#2563EB', description: 'Récitation et lecture du Saint Coran' },
  { label: 'Lecture et mémorisation du Saint Coran', code: 'COR-LEC-MEM', parentCode: 'COR', weeklyHours: 2, description: 'Lecture, récitation et mémorisation du Coran' },
];

interface TeacherDef {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  specialization: string;
  subjectCodes: string[];
  phone: string;
}

const TEACHERS: TeacherDef[] = [
  { firstName: 'Abdelkader', lastName: 'Mansouri', gender: 'MALE', specialization: 'Coran', subjectCodes: ['COR', 'COR-LEC-MEM'], phone: '0612345678' },
  { firstName: 'Ibrahim', lastName: 'Lahlou', gender: 'MALE', specialization: 'Langue arabe', subjectCodes: ['AR', 'AR-LEC', 'AR-ECRITURE', 'COR'], phone: '0623456789' },
  { firstName: 'Youssef', lastName: 'El Amrani', gender: 'MALE', specialization: 'Éducation musulmane', subjectCodes: ['EDM', 'EDM-ADO', 'EDM-HIS', 'COMP'], phone: '0634567890' },
  { firstName: 'Khadija', lastName: 'Benali', gender: 'FEMALE', specialization: 'Coran', subjectCodes: ['COR', 'COR-LEC-MEM'], phone: '0645678901' },
  { firstName: 'Aïcha', lastName: 'Rahmani', gender: 'FEMALE', specialization: 'Arabe et éducation', subjectCodes: ['AR', 'AR-GRAM', 'EDM', 'EDM-FOI'], phone: '0656789012' },
];

// Règle fondamentale : 1 classe = 1 seul créneau hebdomadaire (TimeSlot).
// L'élève vient UNE SEULE fois par semaine, au créneau de sa classe.
// Le professeur attitré (mainTeacher) enseigne TOUTES les matières à sa classe.
interface ClassDef {
  label: string;
  levelCode: string;
  classGender: 'FILLE' | 'GARCON' | 'MIXTE';
  capacity: number;
  room: string;
  mainTeacherLastName: string;
  // Exactly ONE schedule per class (no subject/teacher — teacher is on ClassGroup)
  slot: {
    timeSlot: 'MERCREDI_PM' | 'SAMEDI_AM' | 'SAMEDI_PM' | 'DIMANCHE_AM' | 'DIMANCHE_PM';
    startTime: string;
    endTime: string;
  };
}

const CLASSES: ClassDef[] = [
  {
    label: 'Débutants - Mixte',
    levelCode: 'DEB',
    classGender: 'MIXTE',
    capacity: 15,
    room: 'Salle 1',
    mainTeacherLastName: 'Lahlou',
    slot: { timeSlot: 'SAMEDI_AM', startTime: '09:00', endTime: '12:00' },
  },
  {
    label: 'Débutants - Filles',
    levelCode: 'DEB',
    classGender: 'FILLE',
    capacity: 12,
    room: 'Salle 2',
    mainTeacherLastName: 'Rahmani',
    slot: { timeSlot: 'SAMEDI_PM', startTime: '14:00', endTime: '17:00' },
  },
  {
    label: 'Coran N1 - Garçons',
    levelCode: 'COR-1',
    classGender: 'GARCON',
    capacity: 10,
    room: 'Salle 1',
    mainTeacherLastName: 'Mansouri',
    slot: { timeSlot: 'MERCREDI_PM', startTime: '14:00', endTime: '17:00' },
  },
  {
    label: 'Coran N1 - Filles',
    levelCode: 'COR-1',
    classGender: 'FILLE',
    capacity: 10,
    room: 'Salle 2',
    mainTeacherLastName: 'Benali',
    slot: { timeSlot: 'DIMANCHE_AM', startTime: '09:00', endTime: '12:00' },
  },
  {
    label: 'Tajwid & Arabe - Mixte',
    levelCode: 'TAJ-INIT',
    classGender: 'MIXTE',
    capacity: 12,
    room: 'Salle 3',
    mainTeacherLastName: 'El Amrani',
    slot: { timeSlot: 'DIMANCHE_PM', startTime: '14:00', endTime: '17:00' },
  },
  {
    label: 'Mémorisation Juz Amma - Filles',
    levelCode: 'MEM-JA',
    classGender: 'FILLE',
    capacity: 8,
    room: 'Salle 4',
    mainTeacherLastName: 'Benali',
    slot: { timeSlot: 'SAMEDI_PM', startTime: '14:00', endTime: '17:00' },
  },
  // Démonstration du multi-classes par créneau : 3 classes le SAMEDI_AM
  // (Lahlou en Salle 1 ci-dessus + les deux qui suivent).
  {
    label: 'Arabe A1 - Garçons',
    levelCode: 'AR-A1',
    classGender: 'GARCON',
    capacity: 10,
    room: 'Salle 2',
    mainTeacherLastName: 'Mansouri',
    slot: { timeSlot: 'SAMEDI_AM', startTime: '09:00', endTime: '12:00' },
  },
  {
    label: 'Tajwid Initiation - Filles',
    levelCode: 'TAJ-INIT',
    classGender: 'FILLE',
    capacity: 10,
    room: 'Salle 3',
    mainTeacherLastName: 'Rahmani',
    slot: { timeSlot: 'SAMEDI_AM', startTime: '09:00', endTime: '12:00' },
  },
];

// Families: 2 with 3 children, 5 with 2 children, rest with 1 child
// Classes changed: "Débutants - Garçons" → "Débutants - Mixte", "Tajwid & Arabe - Garçons" → "Tajwid & Arabe - Mixte"
// MIXTE classes have both MALE and FEMALE students
interface FamilyDef {
  fatherFirst: string;
  motherFirst: string;
  lastName: string;
  children: { firstName: string; gender: 'MALE' | 'FEMALE'; birthYear: number; birthMonth: number; birthDay: number; classLabel: string }[];
}

const FAMILIES: FamilyDef[] = [
  // === 2 families with 3 children ===
  {
    fatherFirst: 'Mohamed', motherFirst: 'Fatima', lastName: 'Benali',
    children: [
      { firstName: 'Ahmed', gender: 'MALE', birthYear: 2012, birthMonth: 3, birthDay: 15, classLabel: 'Coran N1 - Garçons' },
      { firstName: 'Maryam', gender: 'FEMALE', birthYear: 2014, birthMonth: 7, birthDay: 22, classLabel: 'Coran N1 - Filles' },
      { firstName: 'Adam', gender: 'MALE', birthYear: 2017, birthMonth: 11, birthDay: 8, classLabel: 'Débutants - Mixte' },
    ],
  },
  {
    fatherFirst: 'Hassan', motherFirst: 'Khadija', lastName: 'Amrani',
    children: [
      { firstName: 'Youssef', gender: 'MALE', birthYear: 2011, birthMonth: 1, birthDay: 10, classLabel: 'Tajwid & Arabe - Mixte' },
      { firstName: 'Zainab', gender: 'FEMALE', birthYear: 2013, birthMonth: 5, birthDay: 3, classLabel: 'Coran N1 - Filles' },
      { firstName: 'Anas', gender: 'MALE', birthYear: 2016, birthMonth: 9, birthDay: 27, classLabel: 'Débutants - Mixte' },
    ],
  },
  // === 5 families with 2 children ===
  {
    fatherFirst: 'Karim', motherFirst: 'Amina', lastName: 'Daoudi',
    children: [
      { firstName: 'Ibrahim', gender: 'MALE', birthYear: 2013, birthMonth: 6, birthDay: 12, classLabel: 'Coran N1 - Garçons' },
      { firstName: 'Hafsa', gender: 'FEMALE', birthYear: 2015, birthMonth: 10, birthDay: 5, classLabel: 'Débutants - Filles' },
    ],
  },
  {
    fatherFirst: 'Rachid', motherFirst: 'Sarah', lastName: 'Ghazali',
    children: [
      { firstName: 'Omar', gender: 'MALE', birthYear: 2012, birthMonth: 2, birthDay: 18, classLabel: 'Tajwid & Arabe - Mixte' },
      { firstName: 'Salma', gender: 'FEMALE', birthYear: 2014, birthMonth: 8, birthDay: 30, classLabel: 'Mémorisation Juz Amma - Filles' },
    ],
  },
  {
    fatherFirst: 'Driss', motherFirst: 'Samira', lastName: 'Mansouri',
    children: [
      { firstName: 'Hamza', gender: 'MALE', birthYear: 2011, birthMonth: 4, birthDay: 7, classLabel: 'Tajwid & Arabe - Mixte' },
      { firstName: 'Inès', gender: 'FEMALE', birthYear: 2013, birthMonth: 12, birthDay: 19, classLabel: 'Coran N1 - Filles' },
    ],
  },
  {
    fatherFirst: 'Omar', motherFirst: 'Nour', lastName: 'Tazi',
    children: [
      { firstName: 'Bilal', gender: 'MALE', birthYear: 2014, birthMonth: 3, birthDay: 25, classLabel: 'Coran N1 - Garçons' },
      { firstName: 'Rania', gender: 'FEMALE', birthYear: 2017, birthMonth: 1, birthDay: 14, classLabel: 'Débutants - Filles' },
    ],
  },
  {
    fatherFirst: 'Yassine', motherFirst: 'Leïla', lastName: 'Idrissi',
    children: [
      { firstName: 'Ismaïl', gender: 'MALE', birthYear: 2015, birthMonth: 7, birthDay: 3, classLabel: 'Débutants - Mixte' },
      { firstName: 'Yasmine', gender: 'FEMALE', birthYear: 2012, birthMonth: 11, birthDay: 28, classLabel: 'Mémorisation Juz Amma - Filles' },
    ],
  },
  // === Single-child families ===
  {
    fatherFirst: 'Amine', motherFirst: 'Aïcha', lastName: 'Chaoui',
    children: [
      { firstName: 'Yassine', gender: 'MALE', birthYear: 2013, birthMonth: 9, birthDay: 14, classLabel: 'Coran N1 - Garçons' },
    ],
  },
  {
    fatherFirst: 'Nabil', motherFirst: 'Safia', lastName: 'Bouhmidi',
    children: [
      { firstName: 'Rayan', gender: 'MALE', birthYear: 2017, birthMonth: 5, birthDay: 20, classLabel: 'Débutants - Mixte' },
    ],
  },
  {
    fatherFirst: 'Khalid', motherFirst: 'Myriam', lastName: 'El Amrani',
    children: [
      { firstName: 'Sami', gender: 'MALE', birthYear: 2012, birthMonth: 8, birthDay: 9, classLabel: 'Tajwid & Arabe - Mixte' },
    ],
  },
  {
    fatherFirst: 'Tarik', motherFirst: 'Asma', lastName: 'Jabri',
    children: [
      { firstName: 'Ilyas', gender: 'MALE', birthYear: 2011, birthMonth: 2, birthDay: 11, classLabel: 'Tajwid & Arabe - Mixte' },
    ],
  },
  {
    fatherFirst: 'Mehdi', motherFirst: 'Lina', lastName: 'Fassi',
    children: [
      { firstName: 'Nour', gender: 'FEMALE', birthYear: 2014, birthMonth: 4, birthDay: 16, classLabel: 'Coran N1 - Filles' },
    ],
  },
  {
    fatherFirst: 'Sofiane', motherFirst: 'Hajar', lastName: 'Nadiri',
    children: [
      { firstName: 'Aïcha', gender: 'FEMALE', birthYear: 2016, birthMonth: 6, birthDay: 2, classLabel: 'Débutants - Filles' },
    ],
  },
  {
    fatherFirst: 'Hicham', motherFirst: 'Zineb', lastName: 'Ouazzani',
    children: [
      { firstName: 'Safia', gender: 'FEMALE', birthYear: 2013, birthMonth: 10, birthDay: 23, classLabel: 'Mémorisation Juz Amma - Filles' },
    ],
  },
  {
    fatherFirst: 'Adil', motherFirst: 'Salma', lastName: 'Sebti',
    children: [
      { firstName: 'Fatima', gender: 'FEMALE', birthYear: 2015, birthMonth: 1, birthDay: 30, classLabel: 'Débutants - Filles' },
    ],
  },
  {
    fatherFirst: 'Zakaria', motherFirst: 'Rim', lastName: 'Ziani',
    children: [
      { firstName: 'Zakariya', gender: 'MALE', birthYear: 2018, birthMonth: 3, birthDay: 5, classLabel: 'Débutants - Mixte' },
    ],
  },
  {
    fatherFirst: 'Mourad', motherFirst: 'Karima', lastName: 'Lahlou',
    children: [
      { firstName: 'Mehdi', gender: 'MALE', birthYear: 2012, birthMonth: 7, birthDay: 17, classLabel: 'Tajwid & Arabe - Mixte' },
    ],
  },
  {
    fatherFirst: 'Saïd', motherFirst: 'Souad', lastName: 'Hamidi',
    children: [
      { firstName: 'Imran', gender: 'MALE', birthYear: 2017, birthMonth: 12, birthDay: 1, classLabel: 'Débutants - Mixte' },
    ],
  },
  {
    fatherFirst: 'Abdellah', motherFirst: 'Naïma', lastName: 'Kabbaj',
    children: [
      { firstName: 'Idris', gender: 'MALE', birthYear: 2013, birthMonth: 5, birthDay: 22, classLabel: 'Coran N1 - Garçons' },
    ],
  },
  {
    fatherFirst: 'Brahim', motherFirst: 'Hanan', lastName: 'Rahmani',
    children: [
      { firstName: 'Lina', gender: 'FEMALE', birthYear: 2015, birthMonth: 9, birthDay: 8, classLabel: 'Débutants - Filles' },
    ],
  },
  {
    fatherFirst: 'Fouad', motherFirst: 'Jamila', lastName: 'Benomar',
    children: [
      { firstName: 'Leïla', gender: 'FEMALE', birthYear: 2012, birthMonth: 11, birthDay: 13, classLabel: 'Mémorisation Juz Amma - Filles' },
    ],
  },
  {
    fatherFirst: 'Jamal', motherFirst: 'Latifa', lastName: 'Alaoui',
    children: [
      { firstName: 'Hajar', gender: 'FEMALE', birthYear: 2014, birthMonth: 2, birthDay: 26, classLabel: 'Coran N1 - Filles' },
    ],
  },
  // Extra female students in MIXTE classes for gender diversity
  {
    fatherFirst: 'Redouane', motherFirst: 'Wafa', lastName: 'Chraibi',
    children: [
      { firstName: 'Nadia', gender: 'FEMALE', birthYear: 2016, birthMonth: 8, birthDay: 4, classLabel: 'Débutants - Mixte' },
    ],
  },
  {
    fatherFirst: 'Samir', motherFirst: 'Houda', lastName: 'Kettani',
    children: [
      { firstName: 'Sara', gender: 'FEMALE', birthYear: 2012, birthMonth: 6, birthDay: 15, classLabel: 'Tajwid & Arabe - Mixte' },
    ],
  },
  // Familles pour peupler les 2 classes supplémentaires du SAMEDI_AM
  {
    fatherFirst: 'Tariq', motherFirst: 'Selma', lastName: 'Belkacem',
    children: [
      { firstName: 'Ayoub', gender: 'MALE', birthYear: 2011, birthMonth: 4, birthDay: 12, classLabel: 'Arabe A1 - Garçons' },
      { firstName: 'Sofia', gender: 'FEMALE', birthYear: 2013, birthMonth: 9, birthDay: 1, classLabel: 'Tajwid Initiation - Filles' },
    ],
  },
  {
    fatherFirst: 'Walid', motherFirst: 'Noura', lastName: 'Lasri',
    children: [
      { firstName: 'Yazid', gender: 'MALE', birthYear: 2012, birthMonth: 2, birthDay: 28, classLabel: 'Arabe A1 - Garçons' },
      { firstName: 'Meriem', gender: 'FEMALE', birthYear: 2012, birthMonth: 8, birthDay: 5, classLabel: 'Tajwid Initiation - Filles' },
    ],
  },
];

// Each class has exactly 1 créneau, so course contents reference that créneau's timeSlot
const COURSE_CONTENTS = [
  { classLabel: 'Débutants - Mixte', subjectCode: 'AR', daysAgo: 7, content: 'Apprentissage des lettres Alif (أ), Ba (ب), Ta (ت), Tha (ث). Exercices d\'écriture sur cahier.' },
  { classLabel: 'Débutants - Mixte', subjectCode: 'AR', daysAgo: 14, content: 'Révision des lettres précédentes. Introduction de Jim (ج), Ha (ح), Kha (خ). Exercices de prononciation.' },
  { classLabel: 'Coran N1 - Garçons', subjectCode: 'COR', daysAgo: 4, content: 'Lecture des versets 1 à 10 de la sourate Al-Baqara. Correction individuelle de la prononciation, révision des règles de madd.' },
  { classLabel: 'Coran N1 - Garçons', subjectCode: 'COR', daysAgo: 11, content: 'Introduction aux règles du Noun Sakina et Tanwine : Idh-har, Idgham, Iqlab et Ikhfa. Exemples pratiques dans le Coran.' },
  { classLabel: 'Coran N1 - Filles', subjectCode: 'COR', daysAgo: 7, content: 'Sourate Al-Mulk : lecture des versets 1 à 15. Travail en binômes sur la fluidité de lecture.' },
  { classLabel: 'Tajwid & Arabe - Mixte', subjectCode: 'COR-LEC-MEM', daysAgo: 7, content: 'Révision des règles de Madd (prolongation) : Madd Tabii, Madd Wâjib, Madd Jâ\'iz. Application sur sourate Yâ-Sîn.' },
  { classLabel: 'Débutants - Filles', subjectCode: 'AR', daysAgo: 7, content: 'Écoute et répétition de la sourate Al-Ikhlass et sourate Al-Falaq. Travail de mémorisation par répétition.' },
  { classLabel: 'Mémorisation Juz Amma - Filles', subjectCode: 'COR-LEC-MEM', daysAgo: 7, content: 'Mémorisation du verset du Trône (Ayat Al-Kursi). Récitation individuelle et correction.' },
  { classLabel: 'Tajwid & Arabe - Mixte', subjectCode: 'EDM', daysAgo: 14, content: 'Introduction aux piliers de l\'Islam et piliers de la foi (Iman). Discussion et questions-réponses.' },
  { classLabel: 'Coran N1 - Filles', subjectCode: 'COR', daysAgo: 14, content: 'La vie du Prophète ﷺ avant la révélation : sa jeunesse, son mariage avec Khadija, sa réputation à La Mecque.' },
];

const HOMEWORKS = [
  { classLabel: 'Débutants - Mixte', subjectCode: 'AR', daysAgoCreated: 7, dueDaysFromNow: 3, description: 'Écrire 10 fois chaque lettre : Alif (أ), Ba (ب), Ta (ت), Tha (ث) sur le cahier d\'écriture arabe.' },
  { classLabel: 'Coran N1 - Garçons', subjectCode: 'COR', daysAgoCreated: 4, dueDaysFromNow: 7, description: 'Mémoriser les versets 1 à 5 de la sourate Al-Baqara. Récitation demandée au prochain cours.' },
  { classLabel: 'Coran N1 - Garçons', subjectCode: 'COR', daysAgoCreated: 11, dueDaysFromNow: -4, description: 'Réviser les 4 règles du Noun Sakina et Tanwine. Trouver 3 exemples de chaque règle dans le Juz Amma.' },
  { classLabel: 'Coran N1 - Filles', subjectCode: 'COR', daysAgoCreated: 7, dueDaysFromNow: 3, description: 'Poursuivre la lecture de la sourate Al-Mulk (versets 15 à 30). Préparer la lecture à voix haute.' },
  { classLabel: 'Tajwid & Arabe - Mixte', subjectCode: 'AR-EXPR-ECR', daysAgoCreated: 1, dueDaysFromNow: 10, description: 'Rédiger 5 phrases en arabe en utilisant le vocabulaire vu en cours (famille, école, maison).' },
  { classLabel: 'Débutants - Filles', subjectCode: 'AR', daysAgoCreated: 8, dueDaysFromNow: -1, description: 'Mémoriser la sourate Al-Ikhlass (3 versets). Récitation évaluée au prochain cours.' },
  { classLabel: 'Mémorisation Juz Amma - Filles', subjectCode: 'COR-LEC-MEM', daysAgoCreated: 4, dueDaysFromNow: 7, description: 'Mémoriser Ayat Al-Kursi (verset 255, sourate Al-Baqara). Récitation sans faute demandée.' },
  { classLabel: 'Coran N1 - Filles', subjectCode: 'COR', daysAgoCreated: 14, dueDaysFromNow: -7, description: 'Lire le chapitre sur la révélation dans le livre de Sîra. Préparer 3 questions pour le prochain cours.' },
];

// These 2 students will have ~60% absence rate → 4+ absences over 4 weeks
const ALERT_STUDENTS = ['Youssef Amrani', 'Salma Ghazali'];

// =====================================================
// SEED FUNCTIONS
// =====================================================

async function cleanDatabase() {
  console.log('🧹 Nettoyage de la base de données...');
  await prisma.appreciation.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.homework.deleteMany();
  await prisma.courseContent.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.studentParent.deleteMany();
  await prisma.student.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.classGroup.deleteMany();
  await prisma.teacher.deleteMany();
  // Subjects : on supprime d'abord les enfants puis les parents pour éviter les conflits de cascade
  await prisma.subject.deleteMany({ where: { parentId: { not: null } } });
  await prisma.subject.deleteMany();
  await prisma.level.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();
  console.log('   ✓ Base nettoyée');
}

async function createSchool() {
  console.log('🏫 Création de l\'école...');
  const school = await prisma.school.create({
    data: {
      name: 'ACMSCHOOL',
      code: 'ACMSCHOOL-001',
      address: '42 rue des Lilas, 93100 Montreuil',
      phone: '0148578900',
      email: 'contact@acmschool.fr',
      country: 'France',
      timezone: 'Europe/Paris',
    },
  });
  console.log(`   ✓ École "${school.name}" créée (${school.id})`);
  return school;
}

async function createAcademicYear(schoolId: string) {
  console.log('📅 Création de l\'année scolaire...');
  const year = await prisma.academicYear.create({
    data: {
      schoolId,
      label: '2025-2026',
      startDate: date(2025, 9, 1),
      endDate: date(2026, 6, 30),
      isCurrent: true,
      status: 'ACTIVE',
      trimestre1Start: date(2025, 9, 1),
      trimestre1End: date(2025, 12, 20),
      trimestre2Start: date(2026, 1, 5),
      trimestre2End: date(2026, 3, 28),
      trimestre3Start: date(2026, 4, 6),
      trimestre3End: date(2026, 6, 30),
    },
  });
  console.log(`   ✓ Année "${year.label}" créée (ACTIVE, 3 trimestres)`);
  return year;
}

async function createAdminUsers(schoolId: string) {
  console.log('👤 Création des utilisateurs admin...');
  const admin = await prisma.user.create({
    data: {
      schoolId,
      email: 'admin@acmschool.fr',
      passwordHash: PASSWORD_HASH, // ChangeMe2026!
      role: 'ADMIN',
      firstName: 'Administrateur',
      lastName: 'ACMSCHOOL',
      isActive: true,
    },
  });
  const directeur = await prisma.user.create({
    data: {
      schoolId,
      email: 'directeur@acmschool.fr',
      passwordHash: PASSWORD_HASH, // ChangeMe2026!
      role: 'DIRECTEUR',
      firstName: 'Mustapha',
      lastName: 'Benkirane',
      isActive: true,
    },
  });
  console.log(`   ✓ Admin créé: ${admin.email}`);
  console.log(`   ✓ Directeur créé: ${directeur.email}`);
  return { admin, directeur };
}

async function createLevels(schoolId: string) {
  console.log('📚 Création des niveaux...');
  const levels: Record<string, string> = {};
  for (const lv of LEVELS) {
    const level = await prisma.level.create({
      data: { schoolId, ...lv },
    });
    levels[lv.code] = level.id;
    console.log(`   ✓ Niveau "${lv.label}" (${lv.code})`);
  }
  return levels;
}

async function createSubjects(schoolId: string) {
  console.log('📖 Création des matières (hiérarchie parent → enfant)...');
  const subjects: Record<string, string> = {};

  // Pass 1 : matières de premier niveau (parentCode = null)
  for (const sub of SUBJECTS.filter((s) => s.parentCode === null)) {
    const subject = await prisma.subject.create({
      data: {
        schoolId,
        label: sub.label,
        code: sub.code,
        weeklyHours: sub.weeklyHours,
        description: sub.description,
        color: sub.color,
      },
    });
    subjects[sub.code] = subject.id;
    console.log(`   ✓ Matière "${sub.label}" (${sub.code})`);
  }

  // Pass 2 : sous-matières (référencent une parentCode)
  for (const sub of SUBJECTS.filter((s) => s.parentCode !== null)) {
    const parentId = subjects[sub.parentCode!];
    if (!parentId) throw new Error(`Parent subject "${sub.parentCode}" introuvable pour "${sub.code}"`);
    const subject = await prisma.subject.create({
      data: {
        schoolId,
        parentId,
        label: sub.label,
        code: sub.code,
        weeklyHours: sub.weeklyHours,
        description: sub.description,
        color: sub.color,
      },
    });
    subjects[sub.code] = subject.id;
    console.log(`   ✓ Sous-matière "${sub.label}" (${sub.code}) → parent ${sub.parentCode}`);
  }

  return subjects;
}

async function createTeachers(schoolId: string, subjects: Record<string, string>) {
  console.log('👨‍🏫 Création des professeurs...');
  const teachers: Record<string, { id: string; userId: string }> = {};
  for (const t of TEACHERS) {
    const user = await prisma.user.create({
      data: {
        schoolId,
        email: emailFrom(t.firstName, t.lastName, 'acmschool.fr'),
        passwordHash: PASSWORD_HASH,
        role: 'PROFESSEUR',
        firstName: t.firstName,
        lastName: t.lastName,
        isActive: true,
      },
    });
    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        schoolId,
        gender: t.gender,
        phone: t.phone,
        specialization: t.specialization,
        hireDate: date(2023, 9, 1),
        isActive: true,
      },
    });
    for (const sc of t.subjectCodes) {
      await prisma.teacherSubject.create({
        data: { teacherId: teacher.id, subjectId: subjects[sc] },
      });
    }
    teachers[t.lastName] = { id: teacher.id, userId: user.id };
    console.log(`   ✓ Prof "${t.firstName} ${t.lastName}" → ${t.subjectCodes.join(', ')}`);
  }
  return teachers;
}

async function createClassGroups(
  schoolId: string,
  academicYearId: string,
  levels: Record<string, string>,
  teachers: Record<string, { id: string }>,
) {
  console.log('🏛️  Création des classes...');
  const classGroups: Record<string, string> = {};
  for (const cl of CLASSES) {
    const group = await prisma.classGroup.create({
      data: {
        schoolId,
        levelId: levels[cl.levelCode],
        academicYearId,
        label: cl.label,
        classGender: cl.classGender,
        periodType: 'TRIMESTRE',
        capacity: cl.capacity,
        room: cl.room,
        mainTeacherId: teachers[cl.mainTeacherLastName].id,
      },
    });
    classGroups[cl.label] = group.id;
    console.log(`   ✓ Classe "${cl.label}" (${cl.classGender}, capacité ${cl.capacity})`);
  }
  return classGroups;
}

async function createStudentsAndParents(
  schoolId: string,
  classGroups: Record<string, string>,
) {
  console.log('👨‍👩‍👧‍👦 Création des familles, parents et élèves...');
  let studentCount = 0;
  let parentCount = 0;
  let matriculeSeq = 1;
  const studentIds: Record<string, string> = {};

  for (const family of FAMILIES) {
    const fatherUser = await prisma.user.create({
      data: {
        schoolId,
        email: emailFrom(family.fatherFirst, family.lastName),
        passwordHash: null,
        role: 'PARENT',
        firstName: family.fatherFirst,
        lastName: family.lastName,
        isActive: true,
      },
    });
    const father = await prisma.parent.create({
      data: {
        userId: fatherUser.id,
        schoolId,
        gender: 'MALE',
        firstName: family.fatherFirst,
        lastName: family.lastName,
        email: fatherUser.email,
        phone: randomPhone(),
      },
    });
    parentCount++;

    const motherUser = await prisma.user.create({
      data: {
        schoolId,
        email: emailFrom(family.motherFirst, family.lastName),
        passwordHash: null,
        role: 'PARENT',
        firstName: family.motherFirst,
        lastName: family.lastName,
        isActive: true,
      },
    });
    const mother = await prisma.parent.create({
      data: {
        userId: motherUser.id,
        schoolId,
        gender: 'FEMALE',
        firstName: family.motherFirst,
        lastName: family.lastName,
        email: motherUser.email,
        phone: randomPhone(),
      },
    });
    parentCount++;

    for (const child of family.children) {
      const matricule = `ECO-2025-${String(matriculeSeq++).padStart(4, '0')}`;
      const student = await prisma.student.create({
        data: {
          schoolId,
          classGroupId: classGroups[child.classLabel],
          matricule,
          gender: child.gender,
          firstName: child.firstName,
          lastName: family.lastName,
          dateOfBirth: date(child.birthYear, child.birthMonth, child.birthDay),
          nationality: 'Française',
          status: 'INSCRIT',
          enrollmentDate: date(2025, 9, 1),
        },
      });

      await prisma.studentParent.create({
        data: { studentId: student.id, parentId: father.id, relationship: 'PERE', isPrimaryContact: true },
      });
      await prisma.studentParent.create({
        data: { studentId: student.id, parentId: mother.id, relationship: 'MERE', isPrimaryContact: false },
      });

      studentIds[`${child.firstName} ${family.lastName}`] = student.id;
      studentCount++;
    }
    console.log(`   ✓ Famille ${family.lastName}: ${family.children.map((c) => c.firstName).join(', ')}`);
  }
  console.log(`   ✓ Total: ${studentCount} élèves, ${parentCount} parents`);
  return studentIds;
}

async function createSchedules(
  schoolId: string,
  academicYearId: string,
  classGroups: Record<string, string>,
) {
  console.log('📅 Création des emplois du temps (1 créneau par classe)...');
  const schedulesByClass: Record<string, { id: string; timeSlot: string }> = {};

  for (const cl of CLASSES) {
    const schedule = await prisma.schedule.create({
      data: {
        schoolId,
        academicYearId,
        classGroupId: classGroups[cl.label],
        timeSlot: cl.slot.timeSlot,
        startTime: cl.slot.startTime,
        endTime: cl.slot.endTime,
        room: cl.room,
      },
    });
    schedulesByClass[cl.label] = { id: schedule.id, timeSlot: cl.slot.timeSlot };
    console.log(`   ✓ ${cl.label} → ${cl.slot.timeSlot} (${cl.slot.startTime}-${cl.slot.endTime})`);
  }
  console.log(`   ✓ ${CLASSES.length} créneaux créés (1 par classe)`);
  return schedulesByClass;
}

async function createCourseContents(
  schoolId: string,
  classGroups: Record<string, string>,
  subjects: Record<string, string>,
  teachers: Record<string, { id: string }>,
  schedulesByClass: Record<string, { id: string; timeSlot: string }>,
) {
  console.log('📝 Création des contenus de cours...');
  const today = new Date();
  for (const cc of COURSE_CONTENTS) {
    const courseDate = new Date(today);
    courseDate.setDate(today.getDate() - cc.daysAgo);
    const classDef = CLASSES.find((c) => c.label === cc.classLabel)!;
    const teacherLastName = classDef.mainTeacherLastName;
    const schedule = schedulesByClass[cc.classLabel];

    await prisma.courseContent.create({
      data: {
        schoolId,
        scheduleId: schedule.id,
        classGroupId: classGroups[cc.classLabel],
        subjectId: subjects[cc.subjectCode],
        teacherId: teachers[teacherLastName].id,
        date: courseDate,
        timeSlot: schedule.timeSlot as 'MERCREDI_PM' | 'SAMEDI_AM' | 'SAMEDI_PM' | 'DIMANCHE_AM' | 'DIMANCHE_PM',
        startTime: classDef.slot.startTime,
        endTime: classDef.slot.endTime,
        content: cc.content,
      },
    });
  }
  console.log(`   ✓ ${COURSE_CONTENTS.length} contenus de cours créés`);
}

async function createHomeworks(
  schoolId: string,
  classGroups: Record<string, string>,
  subjects: Record<string, string>,
  teachers: Record<string, { id: string }>,
) {
  console.log('📋 Création des devoirs...');
  const today = new Date();
  for (const hw of HOMEWORKS) {
    const createdDate = new Date(today);
    createdDate.setDate(today.getDate() - hw.daysAgoCreated);
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + hw.dueDaysFromNow);

    const classDef = CLASSES.find((c) => c.label === hw.classLabel)!;
    const teacherLastName = classDef.mainTeacherLastName;

    await prisma.homework.create({
      data: {
        schoolId,
        classGroupId: classGroups[hw.classLabel],
        subjectId: subjects[hw.subjectCode],
        teacherId: teachers[teacherLastName].id,
        createdDate,
        dueDate,
        description: hw.description,
      },
    });
  }
  console.log(`   ✓ ${HOMEWORKS.length} devoirs créés`);
}

async function createAttendances(
  schoolId: string,
  schedulesByClass: Record<string, { id: string; timeSlot: string }>,
  studentIds: Record<string, string>,
  adminUserId: string,
) {
  console.log('✋ Création des appels (4 dernières semaines)...');
  let totalAttendance = 0;
  let absentCount = 0;
  let retardCount = 0;

  // Build students by class from FAMILIES data
  const studentsByClass: Record<string, { id: string; name: string }[]> = {};
  for (const family of FAMILIES) {
    for (const child of family.children) {
      const name = `${child.firstName} ${family.lastName}`;
      const id = studentIds[name];
      if (!id) continue;
      if (!studentsByClass[child.classLabel]) studentsByClass[child.classLabel] = [];
      studentsByClass[child.classLabel].push({ id, name });
    }
  }

  for (const classLabel of Object.keys(schedulesByClass)) {
    const schedule = schedulesByClass[classLabel];
    const students = studentsByClass[classLabel] || [];

    // Get past dates matching this class's TimeSlot
    const courseDates = getCourseDatesForSlot(schedule.timeSlot, 4);

    for (const courseDate of courseDates) {
      for (const student of students) {
        const isAlertStudent = ALERT_STUDENTS.includes(student.name);

        let status: 'PRESENT' | 'ABSENT' | 'RETARD' | 'EXCUSE';
        if (isAlertStudent) {
          // ~60% absent to ensure 4+ absences over 4 weeks
          const roll = Math.random();
          status = roll < 0.6 ? 'ABSENT' : roll < 0.7 ? 'RETARD' : 'PRESENT';
        } else {
          // Normal: 85% present, 10% absent, 5% late
          const roll = Math.random();
          status = roll < 0.85 ? 'PRESENT' : roll < 0.95 ? 'ABSENT' : 'RETARD';
        }

        if (status === 'ABSENT') absentCount++;
        if (status === 'RETARD') retardCount++;

        await prisma.attendance.create({
          data: {
            schoolId,
            scheduleId: schedule.id,
            studentId: student.id,
            date: courseDate,
            status,
            reason: status === 'ABSENT' ? (Math.random() < 0.3 ? 'Maladie' : null) : status === 'RETARD' ? 'Retard transport' : null,
            isJustified: status === 'ABSENT' ? Math.random() < 0.2 : false,
            halfDay: schedule.timeSlot as 'MERCREDI_PM' | 'SAMEDI_AM' | 'SAMEDI_PM' | 'DIMANCHE_AM' | 'DIMANCHE_PM',
            recordedById: adminUserId,
          },
        });
        totalAttendance++;
      }
    }
  }
  console.log(`   ✓ ${totalAttendance} enregistrements d'appel (${absentCount} absences, ${retardCount} retards)`);
}

interface EvaluationSeed {
  label: string;
  classLabel: string;
  teacherLastName: string;
  subjectCode: string;
  subSubjectCode?: string;
  mode: 'INDIVIDUAL' | 'GROUP';
  evaluationType: 'CONTROLE' | 'EXAMEN';
  coefficient: number;
  daysOffset: number; // négatif = passé, positif = futur
  isLocked: boolean;
  // Notes seulement pour les évals verrouillées
  gradesRange?: { min: number; max: number; absentRate: number };
}

const EVALUATIONS: EvaluationSeed[] = [
  // 3 évaluations VERROUILLÉES avec notes
  {
    label: 'Contrôle Lecture — Sourate Al-Baqara',
    classLabel: 'Coran N1 - Garçons',
    teacherLastName: 'Mansouri',
    subjectCode: 'COR',
    subSubjectCode: 'COR-LEC-MEM',
    mode: 'GROUP',
    evaluationType: 'CONTROLE',
    coefficient: 2,
    daysOffset: -14,
    isLocked: true,
    gradesRange: { min: 5, max: 10, absentRate: 0.1 },
  },
  {
    label: 'Examen trimestriel — Lecture et mémorisation',
    classLabel: 'Coran N1 - Filles',
    teacherLastName: 'Benali',
    subjectCode: 'COR',
    subSubjectCode: 'COR-LEC-MEM',
    mode: 'GROUP',
    evaluationType: 'EXAMEN',
    coefficient: 1,
    daysOffset: -21,
    isLocked: true,
    gradesRange: { min: 4, max: 9, absentRate: 0.12 },
  },
  {
    label: "Contrôle Grammaire — Règles d'accord",
    classLabel: 'Tajwid & Arabe - Mixte',
    teacherLastName: 'El Amrani',
    subjectCode: 'AR',
    subSubjectCode: 'AR-GRAM',
    mode: 'GROUP',
    evaluationType: 'CONTROLE',
    coefficient: 2,
    daysOffset: -10,
    isLocked: true,
    gradesRange: { min: 3, max: 9, absentRate: 0.15 },
  },
  // 2 évaluations OUVERTES sans notes
  {
    label: 'Contrôle Écriture — Lettres arabes',
    classLabel: 'Débutants - Mixte',
    teacherLastName: 'Lahlou',
    subjectCode: 'AR',
    subSubjectCode: 'AR-ECRITURE',
    mode: 'GROUP',
    evaluationType: 'CONTROLE',
    coefficient: 2,
    daysOffset: 3,
    isLocked: false,
  },
  {
    label: 'Examen final — Mémorisation Juz Amma',
    classLabel: 'Mémorisation Juz Amma - Filles',
    teacherLastName: 'Benali',
    subjectCode: 'COR',
    subSubjectCode: 'COR-LEC-MEM',
    mode: 'GROUP',
    evaluationType: 'EXAMEN',
    coefficient: 1,
    daysOffset: 7,
    isLocked: false,
  },
];

async function createEvaluations(
  schoolId: string,
  classGroups: Record<string, string>,
  subjects: Record<string, string>,
  teachers: Record<string, { id: string }>,
) {
  console.log('📝 Création des évaluations et notes...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let evalCount = 0;
  let gradeCount = 0;

  for (const ev of EVALUATIONS) {
    const evalDate = new Date(today);
    evalDate.setDate(today.getDate() + ev.daysOffset);

    const evaluation = await prisma.evaluation.create({
      data: {
        schoolId,
        classGroupId: classGroups[ev.classLabel],
        teacherId: teachers[ev.teacherLastName].id,
        subjectId: subjects[ev.subjectCode],
        subSubjectId: ev.subSubjectCode ? subjects[ev.subSubjectCode] : null,
        label: ev.label,
        mode: ev.mode,
        evaluationType: ev.evaluationType,
        coefficient: ev.coefficient,
        scale: 10,
        date: evalDate,
        isLocked: ev.isLocked,
      },
    });
    evalCount++;
    console.log(`   ✓ Éval "${ev.label}" — ${ev.classLabel}${ev.isLocked ? ' 🔒' : ''}`);

    // Pour les évaluations verrouillées, on génère des notes pour tous les élèves de la classe
    if (ev.isLocked && ev.gradesRange) {
      const students = await prisma.student.findMany({
        where: { classGroupId: classGroups[ev.classLabel] },
        select: { id: true, firstName: true, lastName: true },
      });

      for (const student of students) {
        const isAbsent = Math.random() < ev.gradesRange.absentRate;
        let score: number | null = null;
        if (!isAbsent) {
          const { min, max } = ev.gradesRange;
          // Note arrondie au 0.5
          const raw = min + Math.random() * (max - min);
          score = Math.round(raw * 2) / 2;
        }
        await prisma.grade.create({
          data: {
            evaluationId: evaluation.id,
            studentId: student.id,
            score,
            isAbsent,
          },
        });
        gradeCount++;
      }
    }
  }

  console.log(`   ✓ ${evalCount} évaluations créées, ${gradeCount} notes enregistrées`);
}

async function createAppreciations(
  schoolId: string,
  academicYearId: string,
  classGroups: Record<string, string>,
  subjects: Record<string, string>,
) {
  console.log('💬 Création des appréciations et mentions (Trimestre 1)...');

  // Per-subject comment pool keyed by main-subject code
  const subjectCommentPool: Record<string, string[]> = {
    GEN: [
      'Résultats satisfaisants dans l\'ensemble.',
      'De bons acquis, à consolider.',
      'Travail sérieux.',
    ],
    AR: [
      'Bon niveau en langue arabe, continue ainsi.',
      'Des progrès en lecture, il faut persévérer.',
      'Doit travailler davantage la grammaire.',
    ],
    COMP: [
      'Comportement exemplaire en classe.',
      'Attitude positive, bonne participation.',
      'Doit améliorer sa concentration.',
    ],
    EDM: [
      'Connaissances solides en éducation musulmane.',
      'Bon investissement dans les cours.',
      'Participe activement aux discussions.',
    ],
    COR: [
      'Mémorisation régulière, maintient l\'effort.',
      'Récitation fluide, à perfectionner.',
      'Doit réciter plus régulièrement à la maison.',
    ],
  };

  const generalTemplates = [
    'Excellent trimestre, continue sur cette voie.',
    'Très bon trimestre dans l\'ensemble.',
    'Trimestre satisfaisant, des progrès à confirmer.',
    'Des efforts à fournir pour améliorer les résultats.',
    'Travail régulier nécessaire pour progresser.',
  ];

  const councilTemplates = [
    'Félicitations du conseil de classe.',
    'Encouragements du conseil.',
    'Le conseil invite à plus d\'assiduité.',
    '',
    '',
  ];

  // Build lookup: main subject code by id (for 5 main codes we seeded)
  const mainSubjectIdByCode: Record<string, string> = {
    GEN: subjects['GEN'],
    AR: subjects['AR'],
    COMP: subjects['COMP'],
    EDM: subjects['EDM'],
    COR: subjects['COR'],
  };

  // We pick a representative class with locked evaluations so the mentions
  // reflect real averages: Coran N1 - Garçons has a locked contrôle.
  const priorityClassLabels = [
    'Coran N1 - Garçons',
    'Coran N1 - Filles',
    'Tajwid & Arabe - Mixte',
  ];

  let appreciationCount = 0;

  for (const classLabel of Object.keys(classGroups)) {
    const classId = classGroups[classLabel];
    const students = await prisma.student.findMany({
      where: { classGroupId: classId },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: 'asc' },
    });

    // Compute average for each student from existing grades in T1 (Sept-Dec)
    const evaluations = await prisma.evaluation.findMany({
      where: { classGroupId: classId },
      include: { grades: true },
    });

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      // Compute simple weighted average on 10 scale
      let sum = 0;
      let weights = 0;
      for (const e of evaluations) {
        const g = e.grades.find((x) => x.studentId === s.id);
        if (!g || g.isAbsent || g.score === null) continue;
        sum += g.score * e.coefficient;
        weights += e.coefficient;
      }
      const avg = weights > 0 ? sum / weights : null;

      // Auto mention (mirror of bulletin lib)
      let autoMention: string | null = null;
      if (avg !== null) {
        if (avg >= 9) autoMention = 'EXCELLENT';
        else if (avg >= 8) autoMention = 'TRES_BIEN';
        else if (avg >= 7) autoMention = 'BIEN';
        else if (avg >= 5) autoMention = 'PASSABLE';
        else autoMention = 'INSUFFISANT';
      }

      // Pick general comment from average bracket
      let general: string;
      if (avg === null) general = generalTemplates[2];
      else if (avg >= 9) general = generalTemplates[0];
      else if (avg >= 7) general = generalTemplates[1];
      else if (avg >= 5) general = generalTemplates[2];
      else if (avg >= 4) general = generalTemplates[3];
      else general = generalTemplates[4];

      // Build per-subject comments (only for priority classes to keep seed light)
      const subjectComments: Record<string, string> = {};
      if (priorityClassLabels.includes(classLabel)) {
        for (const code of Object.keys(mainSubjectIdByCode)) {
          const pool = subjectCommentPool[code];
          if (!pool) continue;
          subjectComments[mainSubjectIdByCode[code]] = pool[i % pool.length];
        }
      }

      const councilComment = priorityClassLabels.includes(classLabel)
        ? councilTemplates[i % councilTemplates.length]
        : '';

      // Council decision driven by average (only for priority classes with real data)
      let councilDecision: string | null = null;
      let councilObservation: string | null = null;
      if (priorityClassLabels.includes(classLabel) && avg !== null) {
        if (avg >= 9) {
          councilDecision = 'FELICITATIONS';
          councilObservation = 'Un parcours exemplaire, à poursuivre.';
        } else if (avg >= 8) {
          councilDecision = 'COMPLIMENTS';
          councilObservation = 'Très bon trimestre, résultats solides.';
        } else if (avg >= 6.5) {
          councilDecision = 'ENCOURAGEMENTS';
          councilObservation = 'Des progrès notables, continue sur cette lancée.';
        } else if (avg >= 5) {
          councilDecision = 'MISE_EN_GARDE_TRAVAIL';
          councilObservation = 'Doit renforcer le travail à la maison.';
        } else {
          councilDecision = 'AVERTISSEMENT_TRAVAIL';
          councilObservation = 'Résultats insuffisants, un suivi rapproché est nécessaire.';
        }
      }

      await prisma.appreciation.create({
        data: {
          schoolId,
          studentId: s.id,
          classGroupId: classId,
          academicYearId,
          period: 1,
          generalComment: general,
          subjectComments: subjectComments as object,
          autoMention,
          manualMention: null,
          councilComment: councilComment || null,
          councilDecision,
          councilObservation,
        },
      });
      appreciationCount++;
    }
  }

  console.log(`   ✓ ${appreciationCount} appréciations + mentions + décisions conseil créées (Trimestre 1)`);
}

// =====================================================
// MAIN
// =====================================================

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  🌙 Seed — ACMSCHOOL             ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  await cleanDatabase();

  const school = await createSchool();
  const academicYear = await createAcademicYear(school.id);
  const { admin } = await createAdminUsers(school.id);
  const levels = await createLevels(school.id);
  const subjects = await createSubjects(school.id);
  const teachers = await createTeachers(school.id, subjects);
  const classGroups = await createClassGroups(school.id, academicYear.id, levels, teachers);
  const studentIds = await createStudentsAndParents(school.id, classGroups);
  const schedulesByClass = await createSchedules(school.id, academicYear.id, classGroups);
  await createCourseContents(school.id, classGroups, subjects, teachers, schedulesByClass);
  await createHomeworks(school.id, classGroups, subjects, teachers);
  await createAttendances(school.id, schedulesByClass, studentIds, admin.id);
  await createEvaluations(school.id, classGroups, subjects, teachers);
  await createAppreciations(school.id, academicYear.id, classGroups, subjects);

  // Final counts
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  📊 Résumé final');
  console.log('═══════════════════════════════════════════════════');
  const counts = {
    schools: await prisma.school.count(),
    academicYears: await prisma.academicYear.count(),
    users: await prisma.user.count(),
    teachers: await prisma.teacher.count(),
    levels: await prisma.level.count(),
    subjects: await prisma.subject.count(),
    classGroups: await prisma.classGroup.count(),
    students: await prisma.student.count(),
    parents: await prisma.parent.count(),
    studentParents: await prisma.studentParent.count(),
    teacherSubjects: await prisma.teacherSubject.count(),
    schedules: await prisma.schedule.count(),
    courseContents: await prisma.courseContent.count(),
    homeworks: await prisma.homework.count(),
    attendances: await prisma.attendance.count(),
    evaluations: await prisma.evaluation.count(),
    grades: await prisma.grade.count(),
    appreciations: await prisma.appreciation.count(),
  };
  console.log(`  Écoles:          ${counts.schools}`);
  console.log(`  Années:          ${counts.academicYears}`);
  console.log(`  Utilisateurs:    ${counts.users}`);
  console.log(`  Professeurs:     ${counts.teachers}`);
  console.log(`  Niveaux:         ${counts.levels}`);
  console.log(`  Matières:        ${counts.subjects}`);
  console.log(`  Classes:         ${counts.classGroups}`);
  console.log(`  Élèves:          ${counts.students}`);
  console.log(`  Parents:         ${counts.parents}`);
  console.log(`  Liaisons P-E:    ${counts.studentParents}`);
  console.log(`  Liaisons P-M:    ${counts.teacherSubjects}`);
  console.log(`  Créneaux EDT:    ${counts.schedules}`);
  console.log(`  Contenus cours:  ${counts.courseContents}`);
  console.log(`  Devoirs:         ${counts.homeworks}`);
  console.log(`  Appels:          ${counts.attendances}`);
  console.log(`  Évaluations:     ${counts.evaluations}`);
  console.log(`  Notes:           ${counts.grades}`);
  console.log(`  Appréciations:   ${counts.appreciations}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('  ✅ Seed terminé avec succès !');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Erreur pendant le seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
