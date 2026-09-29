import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export const parks = pgTable("parks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  team: text("team").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  latitude: numeric("latitude", {
    precision: 9,
    scale: 6,
    mode: "number",
  }).notNull(),
  longitude: numeric("longitude", {
    precision: 9,
    scale: 6,
    mode: "number",
  }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const visits = pgTable(
  "visits",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    parkId: integer("park_id")
      .notNull()
      .references(() => parks.id),
    visitDate: date("visit_date"),
    visitYear: smallint("visit_year"),
    rating: integer("rating"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("visits_user_id_park_id_idx").on(table.userId, table.parkId),
    index("visits_user_id_visit_date_idx").on(
      table.userId,
      table.visitDate.desc().nullsFirst(),
    ),
    check("visits_rating_check", sql`${table.rating} BETWEEN 1 AND 5`),
    check(
      "visits_visit_year_matches_date_check",
      sql`${table.visitDate} IS NULL OR ${table.visitYear} IS NULL OR EXTRACT(YEAR FROM ${table.visitDate}) = ${table.visitYear}`,
    ),
  ],
);

export * from "./auth-schema";
