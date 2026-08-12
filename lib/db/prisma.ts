import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/lib/db/generated/client';

/**
 * Prisma client singleton, created on first use.
 *
 * Lazy on purpose: the repository modules are imported statically, so constructing the
 * client at module scope would open a connection pool — and throw on a missing
 * DATABASE_URL — even in a deployment running on the in-memory seed store. Nothing
 * connects until a query is actually issued.
 *
 * The singleton itself matters in two places:
 *  - Development: without it, every hot reload opens a fresh pool until Postgres
 *    refuses new connections.
 *  - Serverless: module scope is reused across invocations on a warm instance, so one
 *    client per instance keeps the pool small instead of one pool per request.
 */

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATA_SOURCE=prisma requires DATABASE_URL. Set it in this environment (see .env.example), ' +
        'or unset DATA_SOURCE to run against the in-memory seed store.',
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      /*
       * Serverless functions are short-lived and each instance holds its own pool, so a
       * large per-instance pool exhausts Postgres' connection limit long before it helps.
       * Behind a pooler (Supabase pgBouncer, Neon pooled endpoint) this should stay small.
       */
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export function getPrisma(): PrismaClient {
  return (globalForPrisma.__prisma ??= createClient());
}
