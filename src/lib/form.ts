import type { z } from "zod";

/** Stan zwracany przez server actions formularzy. */
export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

/** FormData → obiekt (pola puste → undefined, checkboxy → "on"). */
export function formToObject(fd: FormData) {
  const obj: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string" && !k.startsWith("$ACTION")) obj[k] = v;
  }
  return obj;
}

/** Błędy zod → { pole: kod_błędu } (kody tłumaczone w komponentach przez Errors.*). */
export function zodErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export const emptyToUndef = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
