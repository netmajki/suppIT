import { Wrench, Gauge, MonitorCog, HardDriveDownload, Wifi, Cpu, Globe, Building2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CtaBand } from "@/components/cta-band";
import { PageHero } from "@/components/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Services" });
  return { title: t("title"), description: t("intro") };
}

const icons = [Wrench, Gauge, MonitorCog, HardDriveDownload, Wifi, Cpu, Globe, Building2];

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Services");
  return (
    <>
      <PageHero title={t("title")} intro={t("intro")} />
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {icons.map((Icon, i) => (
          <Card key={i}>
            <CardHeader>
              <span className="grid size-11 place-items-center rounded-lg bg-accent text-accent-foreground"><Icon className="size-5" /></span>
              <CardTitle className="pt-2 text-lg">{t(`s${i + 1}Title` as never)}</CardTitle>
            </CardHeader>
            <CardContent className="text-[15px] leading-6 text-muted-foreground">{t(`s${i + 1}Text` as never)}</CardContent>
          </Card>
        ))}
      </section>
      <CtaBand title={t("ctaTitle")} text={t("ctaText")} button={t("ctaButton")} />
    </>
  );
}
