import { randomUUID } from "node:crypto";

import { getAuth } from "@/lib/auth";

import { lastEmailTo, linkIn } from "./mail-sink";

type TestUserInput = { email?: string; password?: string; name?: string };

export async function createVerifiedUser({
  email = `user-${randomUUID()}@example.com`,
  password = "correct-horse-battery-staple",
  name = "Test User",
}: TestUserInput = {}) {
  const auth = getAuth();
  await auth.api.signUpEmail({ body: { email, password, name } });

  const token = linkIn(lastEmailTo(email)).searchParams.get("token");
  if (!token) throw new Error(`No verification token emailed to ${email}`);
  await auth.api.verifyEmail({ query: { token } });

  const { headers, response } = await auth.api.signInEmail({
    body: { email, password },
    returnHeaders: true,
  });
  const cookie = headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");

  return {
    user: response.user,
    email,
    password,
    headers: new Headers({ cookie }),
  };
}
