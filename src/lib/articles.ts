import type { Locale, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/** Opublikowane artykuły w danym języku. */
export function getPublishedArticles(locale: Locale, opts: { category?: string; q?: string; take?: number } = {}) {
  const where: Prisma.ArticleTranslationWhereInput = {
    locale,
    article: { published: true, ...(opts.category ? { category: opts.category } : {}) },
    ...(opts.q
      ? { OR: [{ title: { contains: opts.q, mode: "insensitive" } }, { content: { contains: opts.q, mode: "insensitive" } }] }
      : {}),
  };
  return db.articleTranslation.findMany({
    where,
    orderBy: { article: { publishedAt: "desc" } },
    take: opts.take,
    include: { article: { select: { category: true, coverImage: true, publishedAt: true } } },
  });
}

export async function getArticleCategories(locale: Locale) {
  const rows = await db.article.findMany({
    where: { published: true, category: { not: null }, translations: { some: { locale } } },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category!);
}
