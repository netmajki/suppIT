import { z } from "zod";
import { emptyToUndef } from "@/lib/form";

/** Opcjonalny tekst: pusty string → undefined. */
export const optStr = (max = 500) => z.preprocess(emptyToUndef, z.string().trim().max(max).optional());

/** Kwota: akceptuje przecinek i spacje ("1 249,99"). */
export const money = z.preprocess(
  (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.replace(",", ".").replace(/\s/g, "")) : v),
  z.coerce.number({ error: "invalidNumber" }).min(0, "invalidNumber").max(10_000_000, "invalidNumber").optional(),
);

/** Data z <input type="datetime-local"> lub <input type="date">. */
export const optDate = z.preprocess(emptyToUndef, z.coerce.date({ error: "invalidDate" }).optional());

/** Liczba całkowita ≥ 0 (pusty → wartość domyślna). */
export const intField = (def: number) =>
  z.preprocess(
    (v) => (v === undefined || v === null || (typeof v === "string" && v.trim() === "") ? def : v),
    z.coerce.number({ error: "invalidNumber" }).int("invalidNumber").min(0, "invalidNumber").max(1_000_000, "invalidNumber"),
  );

export const checkbox = z.preprocess((v) => v === "on" || v === true, z.boolean());
