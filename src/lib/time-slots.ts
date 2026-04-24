export const TIME_SLOT_LABELS: Record<string, string> = {
  MERCREDI_PM: 'Mercredi après-midi',
  SAMEDI_AM: 'Samedi matin',
  SAMEDI_PM: 'Samedi après-midi',
  DIMANCHE_AM: 'Dimanche matin',
  DIMANCHE_PM: 'Dimanche après-midi',
};

export const TIME_SLOTS = [
  'MERCREDI_PM',
  'SAMEDI_AM',
  'SAMEDI_PM',
  'DIMANCHE_AM',
  'DIMANCHE_PM',
] as const;

export const GENDER_LABELS: Record<string, string> = {
  FILLE: 'Filles',
  GARCON: 'Garçons',
  MIXTE: 'Mixte',
};

export const PERIOD_LABELS: Record<string, string> = {
  TRIMESTRE: 'Trimestre',
  SEMESTRE: 'Semestre',
  BIMESTRE: 'Bimestre',
  PERIODE: 'Période',
};
