export function formatDateFR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTimeFR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function computeAge(dob: Date | string): number {
  const d = typeof dob === 'string' ? new Date(dob) : dob;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export const STUDENT_STATUS_LABELS: Record<string, string> = {
  INSCRIT: 'Actif',
  EN_ATTENTE: 'En attente',
  RADIE: 'Suspendu',
};

export const RELATIONSHIP_LABELS: Record<string, string> = {
  PERE: 'Père',
  MERE: 'Mère',
  TUTEUR: 'Tuteur',
  AUTRE: 'Autre',
};

export const GENDER_LABELS_STUDENT: Record<string, string> = {
  MALE: 'Masculin',
  FEMALE: 'Féminin',
};
