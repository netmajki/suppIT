import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { routing } from "@/i18n/routing";

export const revalidate = 3600;

const PAGES = ["", "/services", "/repair", "/articles", "/promotions", "/about", "/contact", "/partners", "/impressum", "/datenschutz"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const pages = PAGES.map((p) => ({
    url: `${base}/${routing.defaultLocale}${p}`,
    alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, `${base}/${l}${p}`])) },
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  let articles: MetadataRoute.Sitemap = [];
  try {
    const rows = await db.articleTranslation.findMany({
      where: { article: { published: true } },
      select: { locale: true, slug: true, article: { select: { updatedAt: true } } },
    });
    articles = rows.map((r) => ({ url: `${base}/${r.locale}/articles/${r.slug}`, lastModified: r.article.updatedAt, priority: 0.6 }));
  } catch {
    /* baza niedostępna podczas budowania */
  }
  return [...pages, ...articles];
}
