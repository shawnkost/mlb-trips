import "server-only";

import { getParkById } from "@/lib/dal/parks";
import { visitInputSchema, type VisitInput } from "@/lib/validation/visit";

import { fieldError, parseWith, type ActionResult } from "./result";

export async function parseVisitInput(
  formData: FormData,
): Promise<ActionResult<VisitInput>> {
  const parsed = parseWith(visitInputSchema, Object.fromEntries(formData));
  if (!parsed.ok) return parsed;
  if (!(await getParkById(parsed.data.parkId))) {
    return fieldError("parkId", "Choose a ballpark.");
  }
  return parsed;
}
