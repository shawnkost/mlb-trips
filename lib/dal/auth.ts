import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getAuth } from "@/lib/auth";

export const getSession = cache(async () =>
  getAuth().api.getSession({ headers: await headers() }),
);

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session.user;
}
