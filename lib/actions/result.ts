import { z } from "zod";

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: FieldErrors }
  | { ok: false; error: string };

export type ActionState<T = void> = ActionResult<T> | null;

export function ok(): ActionResult<void>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fieldErrors(errors: FieldErrors): ActionResult<never> {
  return { ok: false, fieldErrors: errors };
}

export function fieldError(field: string, message: string) {
  return fieldErrors({ [field]: [message] });
}

export function failure(error: string): ActionResult<never> {
  return { ok: false, error };
}

export function fromZodError(error: z.ZodError) {
  const { formErrors, fieldErrors: errors } = z.flattenError(error);
  return formErrors.length > 0
    ? failure(formErrors[0])
    : fieldErrors(errors as FieldErrors);
}

export function parseWith<S extends z.ZodType>(
  schema: S,
  input: unknown,
): ActionResult<z.output<S>> {
  const parsed = schema.safeParse(input);
  return parsed.success ? ok(parsed.data) : fromZodError(parsed.error);
}
