import "server-only";

import { and, eq, sql, type SQL } from "drizzle-orm";

import { parks, visits } from "@/db/schema";
import { getDb } from "@/lib/db";

import { requireUser } from "./auth";

export const VISIT_SORTS = ["newest", "oldest"] as const;
export type VisitSort = (typeof VISIT_SORTS)[number];

export type VisitDTO = {
  id: number;
  park: { id: number; slug: string; name: string; team: string };
  visitDate: string | null;
  visitYear: number | null;
  rating: number | null;
  notes: string | null;
  createdAt: Date;
};

const visitColumns = {
  id: visits.id,
  park: {
    id: parks.id,
    slug: parks.slug,
    name: parks.name,
    team: parks.team,
  },
  visitDate: visits.visitDate,
  visitYear: visits.visitYear,
  rating: visits.rating,
  notes: visits.notes,
  createdAt: visits.createdAt,
};

const MAX_ID = 2_147_483_647;

const effectiveYear = sql`coalesce(${visits.visitYear}, extract(year from ${visits.visitDate}))`;

function visitOrder(sort: VisitSort): SQL[] {
  const direction = sort === "newest" ? sql`desc` : sql`asc`;
  return [
    sql`${effectiveYear} ${direction} nulls last`,
    sql`${visits.visitDate} ${direction} nulls last`,
    sql`${visits.createdAt} ${direction}`,
    sql`${visits.id} ${direction}`,
  ];
}

export type ListMyVisitsOptions = { parkId?: number; sort?: VisitSort };

export async function listMyVisits({
  parkId,
  sort = "newest",
}: ListMyVisitsOptions = {}): Promise<VisitDTO[]> {
  const user = await requireUser();
  return getDb()
    .select(visitColumns)
    .from(visits)
    .innerJoin(parks, eq(visits.parkId, parks.id))
    .where(
      and(
        eq(visits.userId, user.id),
        parkId === undefined ? undefined : eq(visits.parkId, parkId),
      ),
    )
    .orderBy(...visitOrder(sort));
}

export async function getMyVisit(id: number): Promise<VisitDTO | null> {
  const user = await requireUser();
  if (!Number.isInteger(id) || id < 1 || id > MAX_ID) return null;
  const [visit] = await getDb()
    .select(visitColumns)
    .from(visits)
    .innerJoin(parks, eq(visits.parkId, parks.id))
    .where(and(eq(visits.id, id), eq(visits.userId, user.id)))
    .limit(1);
  return visit ?? null;
}
