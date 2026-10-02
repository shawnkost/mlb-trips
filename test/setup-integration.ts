import { sql } from "drizzle-orm";
import { afterAll, beforeEach, vi } from "vitest";

import { getDb } from "@/lib/db";

import { testDatabaseUrl } from "./database";
import { clearEmails } from "./mail-sink";

process.env.DATABASE_URL = testDatabaseUrl();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/email", () => import("./mail-sink"));

beforeEach(async () => {
  clearEmails();
  const { rows } = await getDb().execute<{ tablename: string }>(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'parks'`,
  );
  if (rows.length === 0) return;
  const tables = rows.map(({ tablename }) => `"public"."${tablename}"`);
  await getDb().execute(
    sql.raw(`TRUNCATE ${tables.join(", ")} RESTART IDENTITY CASCADE`),
  );
});

afterAll(async () => {
  await getDb().$client.end();
});
