import type { Locale } from "@prisma/client";
import { db } from "@/lib/db";
import { promoState, publicPromoWhere } from "@/lib/promo";

/** Aktywne promocje z treścią w danym języku (fallback: PL, potem dowolny). */
export async function getPublicPromotions(locale: Locale) {
  const promos = await db.promotion.findMany({
    where: publicPromoWhere(),
    orderBy: [{ validTo: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    include: { translations: true },
  });
  return promos
    .filter((p) => promoState(p) === "active")
    .map((p) => {
      const tr = p.translations.find((t) => t.locale === locale) ?? p.translations.find((t) => t.locale === "pl") ?? p.translations[0];
      return tr ? { ...p, title: tr.title, description: tr.description } : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
}
