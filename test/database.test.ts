import { describe, expect, it } from "vitest";

import { assertTestDatabaseUrl } from "./database";

describe("assertTestDatabaseUrl", () => {
  it("accepts a database whose name ends with _test", () => {
    const url = "postgres://mlb:mlb@localhost:5432/mlb_trips_test";
    expect(assertTestDatabaseUrl(url)).toBe(url);
  });

  it("rejects a non-test database", () => {
    expect(() =>
      assertTestDatabaseUrl("postgres://mlb:mlb@localhost:5432/mlb_trips"),
    ).toThrow(/must end with "_test"/);
  });
});
