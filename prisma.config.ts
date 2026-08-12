import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

/*
 * Next.js reads `.env.local` first and `.env` second; the Prisma CLI is a separate
 * process that would otherwise only see `.env`. Loading both in the same order keeps
 * `npx prisma …` and `next dev` pointed at the same database. A missing file is not an
 * error — most setups have only one of the two.
 */
loadEnv({ path: ['.env.local', '.env'], quiet: true });

/**
 * Prisma CLI configuration.
 *
 * From Prisma 7 the connection URL lives here rather than in `schema.prisma`, and the
 * runtime client is constructed with a driver adapter (see `lib/db/prisma.ts`).
 *
 * `directUrl` is what migrations run against. Pooled connection strings (Supabase's
 * pgBouncer endpoint, Neon's pooled host) cannot run DDL, so it falls back to
 * DATABASE_URL only when no separate direct URL is configured.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.mts',
  },
  datasource: {
    /*
     * This URL is used only by the CLI — migrations and seeding. Runtime queries go
     * through the adapter in lib/db/prisma.ts.
     *
     * Migrations need a direct (unpooled) connection: Supabase's pgBouncer endpoint and
     * Neon's pooled host cannot run DDL. So DIRECT_URL wins here when it is set, while
     * the runtime keeps using the pooled DATABASE_URL.
     *
     * Read from `process.env` rather than Prisma's `env()` helper on purpose: `env()`
     * resolves eagerly and fails the whole CLI when the variable is absent, which would
     * break `prisma generate` during a build of a deployment that runs on the in-memory
     * seed store and has no database at all. Commands that genuinely need a connection
     * still fail with their own clear error.
     */
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
