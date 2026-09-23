import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

// No `server-only` import here: tooling outside Next.js (drizzle-kit, a
// planned auth CLI) may load this module. Server-only enforcement belongs in
// the DAL modules that wrap `getDb()`.
function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({ connectionString });
  attachDatabasePool(pool);
  return drizzle({ client: pool, schema });
}

let db: ReturnType<typeof createDb> | undefined;

// Created on first use so builds without DATABASE_URL still succeed.
export function getDb() {
  return (db ??= createDb());
}
