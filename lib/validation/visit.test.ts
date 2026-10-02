import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { parseWith } from "@/lib/actions/result";

import { latestToday, NOTES_MAX_LENGTH, visitInputSchema } from "./visit";

const parse = (input: Record<string, unknown>) =>
  parseWith(visitInputSchema, input);

describe("visitInputSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("parses form values and normalizes blanks to null", () => {
    expect(
      parse({
        parkId: "3",
        visitDate: "",
        visitYear: "",
        rating: "",
        notes: "  ",
      }),
    ).toEqual({
      ok: true,
      data: {
        parkId: 3,
        visitDate: null,
        visitYear: null,
        rating: null,
        notes: null,
      },
    });
  });

  it("derives the visit year from an exact date", () => {
    expect(
      parse({
        parkId: "3",
        visitDate: "2024-05-01",
        rating: "4",
        notes: " Great ",
      }),
    ).toEqual({
      ok: true,
      data: {
        parkId: 3,
        visitDate: "2024-05-01",
        visitYear: 2024,
        rating: 4,
        notes: "Great",
      },
    });
  });

  it("accepts a year without an exact date", () => {
    expect(parse({ parkId: "3", visitYear: "1998" })).toMatchObject({
      ok: true,
      data: { visitDate: null, visitYear: 1998 },
    });
  });

  it.each([
    [{}, "parkId"],
    [{ parkId: "" }, "parkId"],
    [{ parkId: "fenway" }, "parkId"],
    [{ parkId: "0" }, "parkId"],
    [{ parkId: "1", rating: "0" }, "rating"],
    [{ parkId: "1", rating: "6" }, "rating"],
    [{ parkId: "1", rating: "4.5" }, "rating"],
    [{ parkId: "1", visitDate: "2024-02-30" }, "visitDate"],
    [{ parkId: "1", visitDate: "2026-06-17" }, "visitDate"],
    [{ parkId: "1", visitYear: "2027" }, "visitYear"],
    [{ parkId: "1", visitYear: "1875" }, "visitYear"],
    [{ parkId: "1", visitYear: "nineties" }, "visitYear"],
    [{ parkId: "1", visitDate: "2024-05-01", visitYear: "2023" }, "visitYear"],
    [{ parkId: "1", notes: "x".repeat(NOTES_MAX_LENGTH + 1) }, "notes"],
  ])("rejects %j with an error on %s", (input, field) => {
    const result = parse(input);
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty(["fieldErrors", field]);
  });

  it("accepts today's date in the furthest-ahead time zone", () => {
    expect(parse({ parkId: "1", visitDate: "2026-06-16" }).ok).toBe(true);
  });

  it("accepts notes at the length cap", () => {
    expect(parse({ parkId: "1", notes: "x".repeat(NOTES_MAX_LENGTH) }).ok).toBe(
      true,
    );
  });
});

describe("latestToday", () => {
  it("returns the calendar date in UTC+14", () => {
    expect(latestToday(Date.parse("2026-12-31T09:59:59Z"))).toBe("2026-12-31");
    expect(latestToday(Date.parse("2026-12-31T10:00:00Z"))).toBe("2027-01-01");
  });
});
