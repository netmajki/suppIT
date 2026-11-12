import type { Promotion } from "@prisma/client";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export type PromoState = "active" | "inactive" | "expired" | "scheduled" | "exhausted";

export function promoState(p: Pick<Promotion, "active" | "validFrom" | "validTo" | "maxUses" | "usedCount">, now = new Date()): PromoState {
  if (!p.active) return "inactive";
  if (p.validFrom && p.validFrom > now) return "scheduled";
  if (p.validTo && p.validTo < now) return "expired";
  if (p.maxUses !== null && p.usedCount >= p.maxUses) return "exhausted";
  return "active";
}

/** Zwraca aktywną promocję dla kodu (wielkość liter bez znaczenia) lub null. */
export async function findValidPromo(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const promo = await db.promotion.findUnique({ where: { code: normalized } });
  return promo && promoState(promo) === "active" ? promo : null;
}

export function describeDiscount(p: Pick<Promotion, "discountType" | "value">, locale: string, currency = "EUR") {
  return p.discountType === "PERCENT" ? `−${Number(p.value)}%` : `−${formatMoney(p.value, locale, currency)}`;
}

/** Warunek Prisma: promocje widoczne publicznie teraz. */
export const publicPromoWhere = (now = new Date()) => ({
  active: true,
  AND: [{ OR: [{ validFrom: null }, { validFrom: { lte: now } }] }, { OR: [{ validTo: null }, { validTo: { gte: now } }] }],
});
