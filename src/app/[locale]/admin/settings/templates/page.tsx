import type { Locale, NotificationChannel } from "@prisma/client";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { adminOnlyPage } from "@/lib/admin-only";
import { db } from "@/lib/db";
import { defaultTemplate } from "@/lib/notifications/templates";
import { ORDER_STATUSES } from "@/lib/order-meta";
import { cn } from "@/lib/utils";
import { TemplatesForm } from "@/components/admin/templates-form";

export const dynamic = "force-dynamic";

export default async function TemplatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ channel?: string; lang?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await adminOnlyPage();
  const sp = await searchParams;
  const channel: NotificationChannel = sp.channel === "WHATSAPP" ? "WHATSAPP" : "EMAIL";
  const lang: Locale = sp.lang === "pl" || sp.lang === "en" ? sp.lang : "de";
  const t = await getTranslations("Settings");
  const custom = await db.notificationTemplate.findMany({ where: { channel, locale: lang } });
  const rows = ORDER_STATUSES.map((status) => {
    const c = custom.find((x) => x.status === status);
    const def = defaultTemplate(status, channel, lang);
    return {
      status,
      subject: c?.subject && c.subject !== def.subject ? c.subject : "",
      body: c && c.body !== def.body ? c.body : "",
      active: c ? c.active : true,
      defaultSubject: def.subject,
      defaultBody: def.body,
    };
  });
  const pill = (label: string, href: string, active: boolean) => (
    <Link key={href} href={href} className={cn("rounded-full border px-3 py-1 text-sm font-medium", active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>
      {label}
    </Link>
  );
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("templatesIntro")}</p>
      <div className="flex flex-wrap items-center gap-2">
        {pill(t("channelEmail"), `/admin/settings/templates?channel=EMAIL&lang=${lang}`, channel === "EMAIL")}
        {pill(t("channelWhatsapp"), `/admin/settings/templates?channel=WHATSAPP&lang=${lang}`, channel === "WHATSAPP")}
        <span className="mx-2 h-5 border-l" />
        {(["de", "pl", "en"] as const).map((l) => pill(l.toUpperCase(), `/admin/settings/templates?channel=${channel}&lang=${l}`, lang === l))}
      </div>
      {channel === "WHATSAPP" && <p className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">{t("whatsappTemplateNote")}</p>}
      <TemplatesForm channel={channel} locale={lang} rows={rows} />
    </div>
  );
}
