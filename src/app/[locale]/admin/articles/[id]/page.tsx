import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { deleteArticle, updateArticle } from "@/lib/actions/content";
import { ArticleForm } from "@/components/admin/article-form";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const article = await db.article.findUnique({ where: { id }, include: { translations: true } });
  if (!article) notFound();
  const [t, tc] = await Promise.all([getTranslations("AdminArticles"), getTranslations("Common")]);
  const cats = await db.article.findMany({ where: { category: { not: null } }, distinct: ["category"], select: { category: true } });
  const initial: Record<string, string> = {
    category: article.category ?? "",
    coverImage: article.coverImage ?? "",
    published: article.published ? "on" : "",
  };
  for (const tr of article.translations) {
    initial[`title_${tr.locale}`] = tr.title;
    initial[`slug_${tr.locale}`] = tr.slug;
    initial[`excerpt_${tr.locale}`] = tr.excerpt ?? "";
    initial[`content_${tr.locale}`] = tr.content;
  }
  const current = article.translations.find((x) => x.locale === locale) ?? article.translations[0];
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={t("editTitle")}
        subtitle={current?.title}
        actions={
          <>
            {article.published && current && (
              <Button asChild variant="outline">
                <Link href={`/articles/${current.slug}`} locale={current.locale} target="_blank"><ExternalLink />{t("view")}</Link>
              </Button>
            )}
            <form action={deleteArticle.bind(null, id)}>
              <ConfirmSubmit message={tc("confirmDelete")} variant="outline" className="text-destructive"><Trash2 />{tc("delete")}</ConfirmSubmit>
            </form>
          </>
        }
      />
      <ArticleForm action={updateArticle.bind(null, id)} initial={initial} categories={cats.map((c) => c.category!)} />
    </div>
  );
}
