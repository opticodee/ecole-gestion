import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Niveaux' };

import { requireAuth } from '@/lib/auth-utils';
import { getLevels } from '@/server/actions/levels';
import { LevelList } from '@/components/modules/vie-scolaire/levels/level-list';

export default async function NiveauxPage() {
  const session = await requireAuth();
  const levels = await getLevels(session.user.schoolId);

  return <LevelList levels={levels} />;
}
