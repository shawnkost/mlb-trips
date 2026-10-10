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

export type VisitWrite = {
  parkId: number;
  visitDate: string | null;
  visitYear: number | null;
  rating: number | null;
  notes: string | null;
};

export async function createMyVisit(input: VisitWrite): Promise<number> {
  const user = await requireUser();
  const [{ id }] = await getDb()
    .insert(visits)
    .values({ ...input, userId: user.id })
    .returning({ id: visits.id });
  return id;
}

export async function updateMyVisit(
  id: number,
  input: VisitWrite,
): Promise<boolean> {
  const user = await requireUser();
  if (!Number.isInteger(id) || id < 1 || id > MAX_ID) return false;
  const updated = await getDb()
    .update(visits)
    .set(input)
    .where(and(eq(visits.id, id), eq(visits.userId, user.id)))
    .returning({ id: visits.id });
  return updated.length > 0;
}

export async function deleteMyVisit(id: number): Promise<boolean> {
  const user = await requireUser();
  if (!Number.isInteger(id) || id < 1 || id > MAX_ID) return false;
  const deleted = await getDb()
    .delete(visits)
    .where(and(eq(visits.id, id), eq(visits.userId, user.id)))
    .returning({ id: visits.id });
  return deleted.length > 0;
}

export async function markMyParkVisited(
  parkId: number,
): Promise<{ created: boolean }> {
  const user = await requireUser();
  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${`visits:${user.id}:${parkId}`}, 0))`,
    );
    const [existing] = await tx
      .select({ id: visits.id })
      .from(visits)
      .where(and(eq(visits.userId, user.id), eq(visits.parkId, parkId)))
      .limit(1);
    if (existing) return { created: false };
    await tx.insert(visits).values({ userId: user.id, parkId });
    return { created: true };
  });
}
