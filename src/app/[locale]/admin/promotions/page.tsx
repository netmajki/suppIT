import { Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { describeDiscount, promoState, type PromoState } from "@/lib/promo";
import { getCompanySettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/page-header";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

const tone: Record<PromoState, BadgeTone> = { active: "green", inactive: "gray", expired: "red", scheduled: "blue", exhausted: "amber" };
const label: Record<PromoState, string> = { active: "statusActive", inactive: "statusInactive", expired: "statusExpired", scheduled: "statusScheduled", exhausted: "statusExhausted" };

export default async function AdminPromotionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, company] = await Promise.all([getTranslations("AdminPromotions"), getCompanySettings()]);
  const promos = await db.promotion.findMany({ orderBy: { createdAt: "desc" }, include: { translations: true } });
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} actions={<Button asChild><Link href="/admin/promotions/new"><Plus />{t("new")}</Link></Button>} />
      {promos.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <THead>
            <tr><TH>{t("promoTitle")}</TH><TH>{t("code")}</TH><TH>{t("value")}</TH><TH>{t("validTo")}</TH><TH className="text-right">{t("usedCount")}</TH><TH>{t("status")}</TH></tr>
          </THead>
          <TBody>
            {promos.map((p) => {
              const tr = p.translations.find((x) => x.locale === locale) ?? p.translations[0];
              const st = promoState(p);
              return (
                <TR key={p.id}>
                  <TD><Link href={`/admin/promotions/${p.id}`} className="font-medium hover:text-primary">{tr?.title ?? "—"}</Link></TD>
                  <TD className="font-mono text-xs">{p.code ?? "—"}</TD>
                  <TD className="whitespace-nowrap">{describeDiscount(p, locale, company.currency)}</TD>
                  <TD className="whitespace-nowrap">{formatDate(p.validTo, locale)}</TD>
                  <TD className="text-right tabular-nums">{p.usedCount}{p.maxUses !== null && ` / ${p.maxUses}`}</TD>
                  <TD><Badge tone={tone[st]}>{t(label[st])}</Badge></TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}
