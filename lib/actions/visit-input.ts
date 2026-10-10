import "server-only";

import { z } from "zod";

import { getParkById } from "@/lib/dal/parks";
import {
  parkIdSchema,
  visitInputSchema,
  type VisitInput,
} from "@/lib/validation/visit";

import { fieldError, parseWith, type ActionResult } from "./result";

async function withKnownPark<T extends { parkId: number }>(
  parsed: ActionResult<T>,
): Promise<ActionResult<T>> {
  if (!parsed.ok) return parsed;
  if (!(await getParkById(parsed.data.parkId))) {
    return fieldError("parkId", "Choose a ballpark.");
  }
  return parsed;
}

export async function parseVisitInput(
  formData: FormData,
): Promise<ActionResult<VisitInput>> {
  return withKnownPark(
    parseWith(visitInputSchema, Object.fromEntries(formData)),
  );
}

export async function parseParkId(
  parkId: unknown,
): Promise<ActionResult<{ parkId: number }>> {
  return withKnownPark(
    parseWith(z.object({ parkId: parkIdSchema }), { parkId }),
  );
}
