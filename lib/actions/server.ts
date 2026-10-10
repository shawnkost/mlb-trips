import "server-only";

import { unstable_rethrow } from "next/navigation";

import { requireUser } from "@/lib/dal/auth";

import { UNEXPECTED_ERROR } from "./messages";
import { failure, type ActionResult } from "./result";

export type ActionUser = Awaited<ReturnType<typeof requireUser>>;

export async function runAction<T>(
  handler: (user: ActionUser) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  const user = await requireUser();
  try {
    return await handler(user);
  } catch (error) {
    unstable_rethrow(error);
    console.error(error);
    return failure(UNEXPECTED_ERROR);
  }
}
