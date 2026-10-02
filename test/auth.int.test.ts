import { describe, expect, it } from "vitest";

import { getAuth } from "@/lib/auth";

import { createVerifiedUser } from "./auth";
import { lastEmailTo, sentEmails } from "./mail-sink";

describe("test harness auth helpers", () => {
  it("captures the verification email and creates a verified, signed-in user", async () => {
    const { user, email, headers } = await createVerifiedUser();

    expect(user.emailVerified).toBe(true);
    expect(lastEmailTo(email).subject).toBe("Verify your MLB Trips email");

    const session = await getAuth().api.getSession({ headers });
    expect(session?.user.id).toBe(user.id);
  });

  it("starts each test with an empty mail sink", () => {
    expect(sentEmails()).toHaveLength(0);
  });
});
