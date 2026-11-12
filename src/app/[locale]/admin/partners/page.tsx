import { Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminPartnersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tc] = await Promise.all([getTranslations("AdminPartners"), getTranslations("Common")]);
  const partners = await db.partner.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} actions={<Button asChild><Link href="/admin/partners/new"><Plus />{t("new")}</Link></Button>} />
      {partners.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <THead><tr><TH>{t("name")}</TH><TH>{t("url")}</TH><TH className="text-right">{t("sortOrder")}</TH><TH>{t("active")}</TH></tr></THead>
          <TBody>
            {partners.map((p) => (
              <TR key={p.id}>
                <TD>
                  <Link href={`/admin/partners/${p.id}`} className="flex items-center gap-3 font-medium hover:text-primary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.logoUrl && <img src={p.logoUrl} alt="" className="h-6 w-auto max-w-16 object-contain" />}
                    {p.name}
                  </Link>
                </TD>
                <TD className="break-all">{p.url ?? "—"}</TD>
                <TD className="text-right tabular-nums">{p.sortOrder}</TD>
                <TD>{p.active ? <Badge tone="green">{tc("yes")}</Badge> : <Badge>{tc("no")}</Badge>}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
