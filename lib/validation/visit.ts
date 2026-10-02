import { z } from "zod";

export const MIN_VISIT_YEAR = 1876;
export const NOTES_MAX_LENGTH = 2000;

const LATEST_UTC_OFFSET_MS = 14 * 60 * 60 * 1000;

export function latestToday(now = Date.now()) {
  return new Date(now + LATEST_UTC_OFFSET_MS).toISOString().slice(0, 10);
}

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optional = <S extends z.ZodType>(schema: S) =>
  z.preprocess(blankToUndefined, schema.optional());

export const visitInputSchema = z
  .object({
    parkId: z.preprocess(
      blankToUndefined,
      z.coerce
        .number({ error: "Choose a ballpark." })
        .int({ error: "Choose a ballpark." })
        .positive({ error: "Choose a ballpark." }),
    ),
    visitDate: optional(
      z.iso
        .date({ error: "Enter a valid date." })
        .refine((date) => date <= latestToday(), {
          error: "Visit date can't be in the future.",
        }),
    ),
    visitYear: optional(
      z.coerce
        .number({ error: "Enter a valid year." })
        .int({ error: "Enter a valid year." })
        .min(MIN_VISIT_YEAR, {
          error: `Year must be ${MIN_VISIT_YEAR} or later.`,
        })
        .refine((year) => year <= Number(latestToday().slice(0, 4)), {
          error: "Visit year can't be in the future.",
        }),
    ),
    rating: optional(
      z.coerce
        .number({ error: "Rating must be from 1 to 5." })
        .int({ error: "Rating must be from 1 to 5." })
        .min(1, { error: "Rating must be from 1 to 5." })
        .max(5, { error: "Rating must be from 1 to 5." }),
    ),
    notes: optional(
      z
        .string()
        .trim()
        .max(NOTES_MAX_LENGTH, {
          error: `Notes must be ${NOTES_MAX_LENGTH} characters or fewer.`,
        }),
    ),
  })
  .refine(
    ({ visitDate, visitYear }) =>
      !visitDate || !visitYear || Number(visitDate.slice(0, 4)) === visitYear,
    { error: "Year must match the visit date.", path: ["visitYear"] },
  )
  .transform(({ parkId, visitDate, visitYear, rating, notes }) => ({
    parkId,
    visitDate: visitDate ?? null,
    visitYear: visitYear ?? (visitDate ? Number(visitDate.slice(0, 4)) : null),
    rating: rating ?? null,
    notes: notes || null,
  }));

export type VisitInput = z.output<typeof visitInputSchema>;
