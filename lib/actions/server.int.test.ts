import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { parks } from "@/db/schema";
import { getParkBySlug } from "@/lib/dal/parks";
import { getDb } from "@/lib/db";
import { createVerifiedUser } from "@/test/auth";

import { UNEXPECTED_ERROR } from "./messages";
import { ok } from "./result";
import { runAction } from "./server";
import { parseVisitInput } from "./visit-input";

vi.mock("next/headers", () => ({ headers: vi.fn() }));

function form(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}

describe("runAction", () => {
  beforeEach(() => {
    vi.mocked(headers).mockResolvedValue(new Headers());
  });

  it("redirects to sign-in without a session", async () => {
    const handler = vi.fn();
    const error = await runAction(handler).catch((e: unknown) => e);
    expect(isRedirectError(error)).toBe(true);
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes the signed-in user to the handler", async () => {
    const { user, headers: sessionHeaders } = await createVerifiedUser();
    vi.mocked(headers).mockResolvedValue(sessionHeaders);

    expect(await runAction(async ({ id }) => ok(id))).toEqual(ok(user.id));
  });

  it("returns a generic error instead of throwing", async () => {
    const { headers: sessionHeaders } = await createVerifiedUser();
    vi.mocked(headers).mockResolvedValue(sessionHeaders);
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(
      await runAction(async () => {
        throw new Error("database is down");
      }),
    ).toEqual({ ok: false, error: UNEXPECTED_ERROR });
  });
});

describe("parseVisitInput", () => {
  it("accepts an active park", async () => {
    const fenway = await getParkBySlug("fenway-park");
    expect(
      await parseVisitInput(
        form({ parkId: String(fenway!.id), visitYear: "2019", rating: "5" }),
      ),
    ).toMatchObject({
      ok: true,
      data: { parkId: fenway!.id, visitYear: 2019, rating: 5 },
    });
  });

  it("rejects an unknown park", async () => {
    expect(await parseVisitInput(form({ parkId: "999999" }))).toEqual({
      ok: false,
      fieldErrors: { parkId: ["Choose a ballpark."] },
    });
  });

  it("rejects an inactive park", async () => {
    const fenway = await getParkBySlug("fenway-park");
    await getDb()
      .update(parks)
      .set({ isActive: false })
      .where(eq(parks.id, fenway!.id));
    try {
      expect(
        await parseVisitInput(form({ parkId: String(fenway!.id) })),
      ).toMatchObject({
        ok: false,
        fieldErrors: { parkId: expect.any(Array) },
      });
    } finally {
      await getDb()
        .update(parks)
        .set({ isActive: true })
        .where(eq(parks.id, fenway!.id));
    }
  });

  it("returns schema field errors before checking the park", async () => {
    expect(await parseVisitInput(form({ parkId: "1", rating: "9" }))).toEqual({
      ok: false,
      fieldErrors: { rating: ["Rating must be from 1 to 5."] },
    });
  });
});
