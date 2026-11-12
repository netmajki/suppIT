import type { Locale } from "@prisma/client";
import { Search } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getArticleCategories, getPublishedArticles } from "@/lib/articles";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/page-hero";
import { ArticleCard } from "@/components/public/article-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Articles" });
  return { title: t("title"), description: t("intro") };
}

export default async function ArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const [t, articles, categories] = await Promise.all([
    getTranslations("Articles"),
    getPublishedArticles(locale as Locale, { category: sp.category, q }),
    getArticleCategories(locale as Locale),
  ]);
  const chip = (label: string, href: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={cn("rounded-full border px-3 py-1 text-sm font-medium", active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
    >
      {label}
    </Link>
  );
  return (
    <>
      <PageHero title={t("title")} intro={t("intro")}>
        <form className="flex max-w-xl gap-2 pt-2" role="search">
          {sp.category && <input type="hidden" name="category" value={sp.category} />}
          <Input name="q" defaultValue={q} placeholder={t("search")} aria-label={t("search")} className="bg-background" />
          <Button type="submit" variant="outline" size="icon" aria-label={t("search")}><Search /></Button>
        </form>
      </PageHero>
      <section className="mx-auto max-w-6xl space-y-8 px-4 py-12">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chip(t("allCategories"), "/articles", !sp.category)}
            {categories.map((c) => chip(c, `/articles?category=${encodeURIComponent(c)}`, sp.category === c))}
          </div>
        )}
        {articles.length === 0 ? (
          <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => <ArticleCard key={a.id} a={a} locale={locale} readMore={t("readMore")} />)}
          </div>
        )}
      </section>
    </>
  );
}
