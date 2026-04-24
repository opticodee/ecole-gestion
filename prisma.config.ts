import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load .env.local first (Next.js convention), fallback to .env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Use DIRECT_URL (port 5432) for migrations — Supabase pooler (6543) doesn't support migrations
    url: process.env['DIRECT_URL'] || process.env['DATABASE_URL'],
  },
});
