import type { Prisma } from "@prisma/client";

const intlLocale: Record<string, string> = { pl: "pl-PL", de: "de-DE", en: "en-GB" };
export const toIntlLocale = (locale: string) => intlLocale[locale] ?? "pl-PL";

export function formatDate(d: Date | null | undefined, locale: string, withTime = false) {
  if (!d) return "—";
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
  }).format(d);
}

export function formatMoney(v: Prisma.Decimal | number | null | undefined, locale: string, currency = "EUR") {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat(toIntlLocale(locale), { style: "currency", currency }).format(Number(v));
}

/** Date → wartość dla <input type="datetime-local"> (czas lokalny serwera, patrz TZ). */
export function toDateTimeLocal(d: Date | null | undefined) {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Date → wartość dla <input type="date">. */
export function toDateInput(d: Date | null | undefined) {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
