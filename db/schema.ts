import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  integer,
  numeric,
  pgTable,
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
    visitDate: date("visit_date").notNull(),
    rating: integer("rating"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("visits_rating_check", sql`${table.rating} BETWEEN 1 AND 5`),
  ],
);

export * from "./auth-schema";
