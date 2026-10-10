import { unstable_isUnrecognizedActionError } from "next/navigation";

import { STALE_ACTION_ERROR } from "./messages";
import { failure, type ActionResult } from "./result";

export function withStaleActionRetry<State, T>(
  action: (state: State, formData: FormData) => Promise<ActionResult<T>>,
) {
  return async (state: State, formData: FormData) => {
    try {
      return await action(state, formData);
    } catch (error) {
      if (unstable_isUnrecognizedActionError(error)) {
        return failure(STALE_ACTION_ERROR);
      }
      throw error;
    }
  };
}
