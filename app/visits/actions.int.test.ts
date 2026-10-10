import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { visits } from "@/db/schema";
import { getParkBySlug, type ParkDTO } from "@/lib/dal/parks";
import { getDb } from "@/lib/db";
import { createVerifiedUser } from "@/test/auth";

import { createVisit, deleteVisit, markVisited, updateVisit } from "./actions";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function form(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}

async function signIn() {
  const { user, headers: sessionHeaders } = await createVerifiedUser();
  return { userId: user.id, headers: sessionHeaders };
}

function actAs(user: { headers: Headers }) {
  vi.mocked(headers).mockResolvedValue(user.headers);
}

async function visitRows(userId: string) {
  return getDb()
    .select({
      id: visits.id,
      parkId: visits.parkId,
      visitDate: visits.visitDate,
      visitYear: visits.visitYear,
      rating: visits.rating,
      notes: visits.notes,
    })
    .from(visits)
    .where(eq(visits.userId, userId))
    .orderBy(visits.id);
}

async function createAs(
  user: { headers: Headers },
  values: Record<string, string>,
) {
  actAs(user);
  const result = await createVisit(null, form(values));
  if (!result.ok || !("data" in result)) throw new Error("create failed");
  return result.data.id;
}

describe("visit mutation actions", () => {
  let fenway: ParkDTO;
  let wrigley: ParkDTO;

  beforeEach(async () => {
    fenway = (await getParkBySlug("fenway-park"))!;
    wrigley = (await getParkBySlug("wrigley-field"))!;
    vi.mocked(headers).mockResolvedValue(new Headers());
    vi.mocked(revalidatePath).mockClear();
  });

  it("redirects to sign-in without a session", async () => {
    const results = [
      createVisit(null, form({ parkId: String(fenway.id) })),
      updateVisit(1, null, form({ parkId: String(fenway.id) })),
      deleteVisit(1),
      markVisited(fenway.id),
    ];
    for (const result of results) {
      expect(isRedirectError(await result.catch((e: unknown) => e))).toBe(true);
    }
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("creates a visit for the signed-in user", async () => {
    const alice = await signIn();
    actAs(alice);
    const result = await createVisit(
      null,
      form({
        parkId: String(fenway.id),
        visitDate: "2019-07-04",
        rating: "5",
        notes: " Green Monster ",
      }),
    );

    expect(result).toEqual({ ok: true, data: { id: expect.any(Number) } });
    expect(await visitRows(alice.userId)).toEqual([
      {
        id: (result as { data: { id: number } }).data.id,
        parkId: fenway.id,
        visitDate: "2019-07-04",
        visitYear: 2019,
        rating: 5,
        notes: "Green Monster",
      },
    ]);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("returns field errors for invalid input without writing", async () => {
    const alice = await signIn();
    actAs(alice);
    expect(
      await createVisit(null, form({ parkId: String(fenway.id), rating: "9" })),
    ).toEqual({
      ok: false,
      fieldErrors: { rating: ["Rating must be from 1 to 5."] },
    });
    expect(await createVisit(null, form({ parkId: "999999" }))).toEqual({
      ok: false,
      fieldErrors: { parkId: ["Choose a ballpark."] },
    });

    const id = await createAs(alice, { parkId: String(fenway.id) });
    vi.mocked(revalidatePath).mockClear();
    expect(
      await updateVisit(
        id,
        null,
        form({
          parkId: String(fenway.id),
          visitDate: "2019-07-04",
          visitYear: "2020",
        }),
      ),
    ).toEqual({
      ok: false,
      fieldErrors: { visitYear: ["Year must match the visit date."] },
    });
    expect(await markVisited(999_999)).toEqual({
      ok: false,
      fieldErrors: { parkId: ["Choose a ballpark."] },
    });
    expect(await visitRows(alice.userId)).toHaveLength(1);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("updates the owner's visit", async () => {
    const alice = await signIn();
    const id = await createAs(alice, {
      parkId: String(fenway.id),
      visitYear: "2018",
      notes: "First trip",
    });
    vi.mocked(revalidatePath).mockClear();

    expect(
      await updateVisit(
        id,
        null,
        form({
          parkId: String(wrigley.id),
          visitDate: "2021-06-01",
          rating: "4",
        }),
      ),
    ).toEqual({ ok: true, data: undefined });
    expect(await visitRows(alice.userId)).toEqual([
      {
        id,
        parkId: wrigley.id,
        visitDate: "2021-06-01",
        visitYear: 2021,
        rating: 4,
        notes: null,
      },
    ]);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("deletes the owner's visit", async () => {
    const alice = await signIn();
    const id = await createAs(alice, { parkId: String(fenway.id) });
    vi.mocked(revalidatePath).mockClear();

    expect(await deleteVisit(id)).toEqual({ ok: true, data: undefined });
    expect(await visitRows(alice.userId)).toEqual([]);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("refuses to update or delete another user's visit", async () => {
    const alice = await signIn();
    const bob = await signIn();
    const id = await createAs(alice, {
      parkId: String(fenway.id),
      visitYear: "2019",
      rating: "5",
    });
    const before = await visitRows(alice.userId);
    vi.mocked(revalidatePath).mockClear();

    actAs(bob);
    const notFound = { ok: false, error: "That visit no longer exists." };
    expect(
      await updateVisit(
        id,
        null,
        form({ parkId: String(wrigley.id), rating: "1" }),
      ),
    ).toEqual(notFound);
    expect(await deleteVisit(id)).toEqual(notFound);
    expect(
      await updateVisit(999_999, null, form({ parkId: String(fenway.id) })),
    ).toEqual(notFound);
    expect(await deleteVisit(999_999)).toEqual(notFound);

    expect(await visitRows(alice.userId)).toEqual(before);
    expect(await visitRows(bob.userId)).toEqual([]);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("marks a park visited once with a dateless visit", async () => {
    const alice = await signIn();
    actAs(alice);

    expect(await markVisited(fenway.id)).toEqual({
      ok: true,
      data: { created: true },
    });
    expect(await markVisited(fenway.id)).toEqual({
      ok: true,
      data: { created: false },
    });
    expect(await visitRows(alice.userId)).toEqual([
      {
        id: expect.any(Number),
        parkId: fenway.id,
        visitDate: null,
        visitYear: null,
        rating: null,
        notes: null,
      },
    ]);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("does not mark a park visited when a dated visit already exists", async () => {
    const alice = await signIn();
    await createAs(alice, {
      parkId: String(fenway.id),
      visitDate: "2019-07-04",
    });
    const before = await visitRows(alice.userId);

    expect(await markVisited(fenway.id)).toEqual({
      ok: true,
      data: { created: false },
    });
    expect(await visitRows(alice.userId)).toEqual(before);
  });

  it("creates only one visit under concurrent marks", async () => {
    const alice = await signIn();
    actAs(alice);

    const results = await Promise.all(
      Array.from({ length: 30 }, () => markVisited(wrigley.id)),
    );
    expect(
      results.filter((r) => r.ok && "data" in r && r.data.created),
    ).toHaveLength(1);
    expect(await visitRows(alice.userId)).toHaveLength(1);
  });

  it("scopes marks to the signed-in user", async () => {
    const alice = await signIn();
    const bob = await signIn();
    await createAs(alice, { parkId: String(fenway.id) });

    actAs(bob);
    expect(await markVisited(fenway.id)).toEqual({
      ok: true,
      data: { created: true },
    });
    expect(await visitRows(alice.userId)).toHaveLength(1);
    expect(await visitRows(bob.userId)).toHaveLength(1);
  });
});
