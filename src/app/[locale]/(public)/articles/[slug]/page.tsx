import { notFound } from "next/navigation";
import type { Locale } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { CtaBand } from "@/components/cta-band";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";

async function getArticle(locale: string, slug: string) {
  const tr = await db.articleTranslation.findUnique({
    where: { locale_slug: { locale: locale as Locale, slug: decodeURIComponent(slug) } },
    include: { article: { include: { translations: { select: { locale: true, slug: true } } } } },
  });
  return tr && tr.article.published ? tr : null;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const tr = await getArticle(locale, slug);
  if (!tr) return {};
  return {
    title: tr.title,
    description: tr.excerpt ?? undefined,
    alternates: { languages: Object.fromEntries(tr.article.translations.map((x) => [x.locale, `/${x.locale}/articles/${x.slug}`])) },
    openGraph: { title: tr.title, description: tr.excerpt ?? undefined, images: tr.article.coverImage ? [tr.article.coverImage] : undefined },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const tr = await getArticle(locale, slug);
  if (!tr) notFound();
  const t = await getTranslations("Articles");
  return (
    <>
      <article className="mx-auto max-w-3xl space-y-6 px-4 py-12">
        <Link href="/articles" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" />{t("back")}
        </Link>
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {tr.article.category && <Badge tone="blue">{tr.article.category}</Badge>}
            {formatDate(tr.article.publishedAt, locale)}
          </div>
          <h1 className="text-brand-graphite dark:text-foreground">{tr.title}</h1>
          {tr.excerpt && <p className="text-lg text-muted-foreground">{tr.excerpt}</p>}
        </header>
        {tr.article.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tr.article.coverImage} alt="" className="w-full rounded-xl" />
        )}
        <Markdown>{tr.content}</Markdown>
      </article>
      <CtaBand title={t("helpCta")} button={t("helpButton")} />
    </>
  );
}
