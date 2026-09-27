import { sql } from "drizzle-orm";
import {
  check,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const parks = pgTable("parks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
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
});

export const visits = pgTable(
  "visits",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
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
