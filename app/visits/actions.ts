"use server";

import { revalidatePath } from "next/cache";

import {
  failure,
  ok,
  type ActionResult,
  type ActionState,
} from "@/lib/actions/result";
import { runAction } from "@/lib/actions/server";
import { parseParkId, parseVisitInput } from "@/lib/actions/visit-input";
import {
  createMyVisit,
  deleteMyVisit,
  markMyParkVisited,
  updateMyVisit,
} from "@/lib/dal/visits";

const VISIT_NOT_FOUND = "That visit no longer exists.";

export async function createVisit(
  _prevState: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  return runAction(async () => {
    const input = await parseVisitInput(formData);
    if (!input.ok) return input;
    const id = await createMyVisit(input.data);
    revalidatePath("/", "layout");
    return ok({ id });
  });
}

export async function updateVisit(
  id: number,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const input = await parseVisitInput(formData);
    if (!input.ok) return input;
    if (!(await updateMyVisit(id, input.data))) return failure(VISIT_NOT_FOUND);
    revalidatePath("/", "layout");
    return ok();
  });
}

export async function deleteVisit(id: number): Promise<ActionResult> {
  return runAction(async () => {
    if (!(await deleteMyVisit(id))) return failure(VISIT_NOT_FOUND);
    revalidatePath("/", "layout");
    return ok();
  });
}

export async function markVisited(
  parkId: number,
): Promise<ActionResult<{ created: boolean }>> {
  return runAction(async () => {
    const parsed = await parseParkId(parkId);
    if (!parsed.ok) return parsed;
    const result = await markMyParkVisited(parsed.data.parkId);
    revalidatePath("/", "layout");
    return ok(result);
  });
}
