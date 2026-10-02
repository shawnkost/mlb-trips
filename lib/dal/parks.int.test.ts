import { describe, expect, it } from "vitest";

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

  it("looks up an active park by id", async () => {
    const fenway = await getParkBySlug("fenway-park");
    expect(await getParkById(fenway!.id)).toEqual(fenway);
    expect(await getParkById(999_999)).toBeNull();
  });
});
