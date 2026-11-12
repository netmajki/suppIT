import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { createArticle } from "@/lib/actions/content";
import { ArticleForm } from "@/components/admin/article-form";
import { PageHeader } from "@/components/admin/page-header";

export const dynamic = "force-dynamic";

export default async function NewArticlePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminArticles");
  const cats = await db.article.findMany({ where: { category: { not: null } }, distinct: ["category"], select: { category: true } });
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title={t("new")} />
      <ArticleForm action={createArticle} categories={cats.map((c) => c.category!)} />
    </div>
  );
}
