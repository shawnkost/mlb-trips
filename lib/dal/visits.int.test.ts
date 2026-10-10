import { headers } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { visits } from "@/db/schema";
import { getDb } from "@/lib/db";
import { createVerifiedUser } from "@/test/auth";

import { getParkBySlug, type ParkDTO } from "./parks";
import { getMyVisit, listMyVisits } from "./visits";

vi.mock("next/headers", () => ({ headers: vi.fn() }));

type NewVisit = typeof visits.$inferInsert;

async function addVisit(visit: NewVisit) {
  const [{ id }] = await getDb()
    .insert(visits)
    .values(visit)
    .returning({ id: visits.id });
  return id;
}

async function signIn() {
  const { user, headers: sessionHeaders } = await createVerifiedUser();
  return { userId: user.id, headers: sessionHeaders };
}

function actAs(user: { headers: Headers }) {
  vi.mocked(headers).mockResolvedValue(user.headers);
}

describe("scoped visit reads", () => {
  let fenway: ParkDTO;
  let wrigley: ParkDTO;

  beforeEach(async () => {
    fenway = (await getParkBySlug("fenway-park"))!;
    wrigley = (await getParkBySlug("wrigley-field"))!;
    vi.mocked(headers).mockResolvedValue(new Headers());
  });

  it("redirects to sign-in without a session", async () => {
    expect(isRedirectError(await listMyVisits().catch((e) => e))).toBe(true);
    expect(isRedirectError(await getMyVisit(1).catch((e) => e))).toBe(true);
  });

  it("never returns another user's visits", async () => {
    const alice = await signIn();
    const bob = await signIn();
    const aliceVisit = await addVisit({
      userId: alice.userId,
      parkId: fenway.id,
      visitDate: "2019-07-04",
      visitYear: 2019,
      rating: 5,
      notes: "Green Monster",
    });
    const bobVisit = await addVisit({
      userId: bob.userId,
      parkId: fenway.id,
      visitYear: 2021,
    });

    actAs(alice);
    expect(await listMyVisits()).toEqual([
      {
        id: aliceVisit,
        park: {
          id: fenway.id,
          slug: fenway.slug,
          name: fenway.name,
          team: fenway.team,
        },
        visitDate: "2019-07-04",
        visitYear: 2019,
        rating: 5,
        notes: "Green Monster",
        createdAt: expect.any(Date),
      },
    ]);
    expect(await listMyVisits({ parkId: fenway.id })).toHaveLength(1);
    expect(await getMyVisit(aliceVisit)).toMatchObject({ id: aliceVisit });
    expect(await getMyVisit(bobVisit)).toBeNull();

    actAs(bob);
    expect((await listMyVisits()).map((v) => v.id)).toEqual([bobVisit]);
    expect(await getMyVisit(bobVisit)).toMatchObject({ id: bobVisit });
    expect(await getMyVisit(aliceVisit)).toBeNull();
  });

  it("returns null for a missing or invalid id", async () => {
    actAs(await signIn());
    expect(await getMyVisit(999_999)).toBeNull();
    expect(await getMyVisit(0)).toBeNull();
    expect(await getMyVisit(1.5)).toBeNull();
    expect(await getMyVisit(Number.NaN)).toBeNull();
    expect(await getMyVisit(2 ** 31)).toBeNull();
  });

  it("filters by park", async () => {
    const user = await signIn();
    const atFenway = await addVisit({
      userId: user.userId,
      parkId: fenway.id,
      visitYear: 2018,
    });
    const atWrigley = await addVisit({
      userId: user.userId,
      parkId: wrigley.id,
      visitYear: 2020,
    });

    actAs(user);
    expect(
      (await listMyVisits({ parkId: fenway.id })).map((v) => v.id),
    ).toEqual([atFenway]);
    expect(
      (await listMyVisits({ parkId: wrigley.id })).map((v) => v.id),
    ).toEqual([atWrigley]);
    expect(await listMyVisits({ parkId: 999_999 })).toEqual([]);
  });

  it("sorts by date, placing year-only visits after dated ones in the same year and undated visits last", async () => {
    const user = await signIn();
    const visit = (fields: Omit<NewVisit, "userId" | "parkId">) =>
      addVisit({ userId: user.userId, parkId: fenway.id, ...fields });
    const undated = await visit({});
    const year2019 = await visit({ visitYear: 2019 });
    const april2019 = await visit({
      visitDate: "2019-04-10",
      visitYear: 2019,
    });
    const june2021 = await visit({ visitDate: "2021-06-01" });
    const august2019 = await visit({
      visitDate: "2019-08-20",
      visitYear: 2019,
    });
    const year2015 = await visit({ visitYear: 2015 });

    actAs(user);
    expect((await listMyVisits()).map((v) => v.id)).toEqual([
      june2021,
      august2019,
      april2019,
      year2019,
      year2015,
      undated,
    ]);
    expect((await listMyVisits({ sort: "newest" })).map((v) => v.id)).toEqual(
      (await listMyVisits()).map((v) => v.id),
    );
    expect((await listMyVisits({ sort: "oldest" })).map((v) => v.id)).toEqual([
      year2015,
      april2019,
      august2019,
      year2019,
      june2021,
      undated,
    ]);
  });

  it("breaks ties between identical dates by creation order", async () => {
    const user = await signIn();
    const first = await addVisit({
      userId: user.userId,
      parkId: fenway.id,
      visitDate: "2022-05-01",
    });
    const second = await addVisit({
      userId: user.userId,
      parkId: wrigley.id,
      visitDate: "2022-05-01",
    });

    actAs(user);
    expect((await listMyVisits()).map((v) => v.id)).toEqual([second, first]);
    expect((await listMyVisits({ sort: "oldest" })).map((v) => v.id)).toEqual([
      first,
      second,
    ]);
  });
});
