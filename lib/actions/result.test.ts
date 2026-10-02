import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  failure,
  fieldError,
  fieldErrors,
  fromZodError,
  ok,
  parseWith,
} from "./result";

describe("action results", () => {
  it("builds each result shape", () => {
    expect(ok()).toEqual({ ok: true, data: undefined });
    expect(ok({ id: 1 })).toEqual({ ok: true, data: { id: 1 } });
    expect(fieldErrors({ name: ["Required"] })).toEqual({
      ok: false,
      fieldErrors: { name: ["Required"] },
    });
    expect(fieldError("parkId", "Unknown")).toEqual({
      ok: false,
      fieldErrors: { parkId: ["Unknown"] },
    });
    expect(failure("Nope")).toEqual({ ok: false, error: "Nope" });
  });

  it("maps zod field issues to fieldErrors", () => {
    const schema = z.object({ name: z.string().min(1, { error: "Required" }) });
    const parsed = schema.safeParse({ name: "" });
    expect(parsed.success).toBe(false);
    expect(fromZodError(parsed.error!)).toEqual({
      ok: false,
      fieldErrors: { name: ["Required"] },
    });
  });

  it("maps zod form-level issues to an error", () => {
    const schema = z.string({ error: "Bad input" });
    expect(parseWith(schema, 1)).toEqual({ ok: false, error: "Bad input" });
  });

  it("returns parsed data on success", () => {
    expect(parseWith(z.coerce.number(), "4")).toEqual({ ok: true, data: 4 });
  });
});
