import { Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminArticles");
  const articles = await db.article.findMany({ orderBy: { updatedAt: "desc" }, include: { translations: true } });
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} actions={<Button asChild><Link href="/admin/articles/new"><Plus />{t("new")}</Link></Button>} />
      {articles.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <THead><tr><TH>{t("articleTitle")}</TH><TH>{t("category")}</TH><TH>{t("languages")}</TH><TH>{t("published")}</TH></tr></THead>
          <TBody>
            {articles.map((a) => {
              const tr = a.translations.find((x) => x.locale === locale) ?? a.translations[0];
              return (
                <TR key={a.id}>
                  <TD><Link href={`/admin/articles/${a.id}`} className="font-medium hover:text-primary">{tr?.title ?? "—"}</Link></TD>
                  <TD>{a.category ?? "—"}</TD>
                  <TD className="space-x-1">{a.translations.map((x) => <Badge key={x.locale} className="uppercase">{x.locale}</Badge>)}</TD>
                  <TD>{a.published ? <Badge tone="green">{formatDate(a.publishedAt, locale)}</Badge> : <Badge>{t("draft")}</Badge>}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}
