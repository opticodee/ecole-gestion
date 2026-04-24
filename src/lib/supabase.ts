import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Bucket names for Supabase Storage
export const STORAGE_BUCKETS = {
  PHOTOS_ELEVES: 'photos-eleves',
  PIECES_JOINTES_DEVOIRS: 'pieces-jointes-devoirs',
  DOCUMENTS_ADMINISTRATIFS: 'documents-administratifs',
} as const;
