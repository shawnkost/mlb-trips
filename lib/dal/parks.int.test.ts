import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { parks } from "@/db/schema";
import { getDb } from "@/lib/db";

import { getParkById, getParkBySlug, listActiveParks } from "./parks";

describe("park catalog", () => {
  it("lists the seeded active parks", async () => {
    const parks = await listActiveParks();
    expect(parks.length).toBeGreaterThanOrEqual(30);
    expect(parks.map((p) => p.name)).toContain("Fenway Park");
  });

  it("looks up a park by slug", async () => {
    const park = await getParkBySlug("fenway-park");
    expect(park).toMatchObject({ name: "Fenway Park", team: "Boston Red Sox" });
    expect(await getParkBySlug("not-a-park")).toBeNull();
  });

  it("looks up a park by id, including inactive parks", async () => {
    const fenway = await getParkBySlug("fenway-park");
    expect(await getParkById(fenway!.id)).toEqual(fenway);
    expect(await getParkById(999_999)).toBeNull();

    await getDb()
      .update(parks)
      .set({ isActive: false })
      .where(eq(parks.id, fenway!.id));
    try {
      expect(await getParkById(fenway!.id)).toEqual(fenway);
      expect(await getParkBySlug("fenway-park")).toBeNull();
    } finally {
      await getDb()
        .update(parks)
        .set({ isActive: true })
        .where(eq(parks.id, fenway!.id));
    }
  });
});
