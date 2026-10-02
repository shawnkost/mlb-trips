import { UnrecognizedActionError } from "next/dist/client/components/unrecognized-action-error";
import { describe, expect, it } from "vitest";

import { withStaleActionRetry } from "./client";
import { STALE_ACTION_ERROR } from "./messages";
import { ok } from "./result";

describe("withStaleActionRetry", () => {
  it("passes through the action result", async () => {
    const action = withStaleActionRetry(async (_state: null, formData) =>
      ok(formData.get("name")),
    );
    const formData = new FormData();
    formData.set("name", "Fenway");
    expect(await action(null, formData)).toEqual({ ok: true, data: "Fenway" });
  });

  it("asks the user to refresh when the action is missing after a deploy", async () => {
    const action = withStaleActionRetry(async () => {
      throw new UnrecognizedActionError("Server Action was not found");
    });
    expect(await action(null, new FormData())).toEqual({
      ok: false,
      error: STALE_ACTION_ERROR,
    });
  });

  it("rethrows other errors", async () => {
    const action = withStaleActionRetry(async () => {
      throw new Error("boom");
    });
    await expect(action(null, new FormData())).rejects.toThrow("boom");
  });
});
