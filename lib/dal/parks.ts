import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { parks } from "@/db/schema";
import { getDb } from "@/lib/db";

export type ParkDTO = {
  id: number;
  slug: string;
  name: string;
  team: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
};

const parkColumns = {
  id: parks.id,
  slug: parks.slug,
  name: parks.name,
  team: parks.team,
  city: parks.city,
  state: parks.state,
  latitude: parks.latitude,
  longitude: parks.longitude,
};

export async function listActiveParks(): Promise<ParkDTO[]> {
  return getDb()
    .select(parkColumns)
    .from(parks)
    .where(eq(parks.isActive, true))
    .orderBy(asc(parks.name));
}

export async function getParkBySlug(slug: string): Promise<ParkDTO | null> {
  const [park] = await getDb()
    .select(parkColumns)
    .from(parks)
    .where(and(eq(parks.slug, slug), eq(parks.isActive, true)))
    .limit(1);
  return park ?? null;
}

// Includes inactive (retired) parks: visits can be historical.
export async function getParkById(id: number): Promise<ParkDTO | null> {
  const [park] = await getDb()
    .select(parkColumns)
    .from(parks)
    .where(eq(parks.id, id))
    .limit(1);
  return park ?? null;
}
