import { BadgePercent } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { describeDiscount } from "@/lib/promo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyCode } from "@/components/public/copy-code";
import type { getPublicPromotions } from "@/lib/public-promos";

type Promo = Awaited<ReturnType<typeof getPublicPromotions>>[number];

export async function PromoCard({ p, locale, currency }: { p: Promo; locale: string; currency: string }) {
  const t = await getTranslations("PromotionsPage");
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg leading-7">{p.title}</CardTitle>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
            <BadgePercent className="size-4" />{describeDiscount(p, locale, currency)}
          </span>
        </div>
        {p.validTo && <p className="text-sm text-muted-foreground">{t("validUntil", { date: formatDate(p.validTo, locale) })}</p>}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        {p.description && <p className="text-[15px] leading-6 text-muted-foreground whitespace-pre-line">{p.description}</p>}
        {p.code && (
          <div className="space-y-2">
            <CopyCode code={p.code} />
            <p className="text-xs text-muted-foreground">
              <Link href={`/repair?code=${encodeURIComponent(p.code)}`} className="text-primary hover:underline">{t("useCode")}</Link>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
