import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({ connectionString });
  attachDatabasePool(pool);
  return drizzle({ client: pool, schema });
}

let db: ReturnType<typeof createDb> | undefined;

export function getDb() {
  return (db ??= createDb());
}
