import { Wrench, Cpu, Globe } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCompanySettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const company = await getCompanySettings();

  const features = [
    { icon: Wrench, title: t("f1Title"), text: t("f1Text") },
    { icon: Cpu, title: t("f2Title"), text: t("f2Text") },
    { icon: Globe, title: t("f3Title"), text: t("f3Text") },
  ];

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-brand-graphite dark:text-foreground">{t("heroTitle")}</h1>
          <p className="text-muted-foreground">{t("heroText")}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={`mailto:${company.email}?subject=${encodeURIComponent(t("ctaRepair"))}`}>{t("ctaRepair")}</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={`mailto:${company.email}`}>{t("ctaContact")}</a>
            </Button>
          </div>
        </div>
      </section>

      <section id="services" className="border-t bg-muted/40">
        <div className="mx-auto max-w-6xl space-y-10 px-4 py-16">
          <h2>{t("featuresTitle")}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <Card key={title}>
                <CardHeader>
                  <span className="grid size-11 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-5" />
                  </span>
                  <CardTitle className="pt-2">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">{text}</CardContent>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{t("comingSoon")}</p>
        </div>
      </section>
    </>
  );
}
