import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

import { testDatabaseUrl } from "./database";

async function ensureDatabaseExists(url: string) {
  const name = new URL(url).pathname.slice(1);
  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";
  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [name],
    );
    if (!rowCount) await client.query(`CREATE DATABASE "${name}"`);
  } finally {
    await client.end();
  }
}

export default async function setup() {
  const url = testDatabaseUrl();
  await ensureDatabaseExists(url);

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(
      "DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;",
    );
    await migrate(drizzle({ client }), { migrationsFolder: "db/migrations" });
  } finally {
    await client.end();
  }
}
