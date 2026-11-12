import { Eye, MessageCircle, Award, Languages } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CtaBand } from "@/components/cta-band";
import { PageHero } from "@/components/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const t = await getTranslations({ locale: (await params).locale, namespace: "About" });
  return { title: t("title"), description: t("lead") };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, ts] = await Promise.all([getTranslations("About"), getTranslations("Services")]);
  const values = [
    { icon: Eye, title: t("v1Title"), text: t("v1Text") },
    { icon: MessageCircle, title: t("v2Title"), text: t("v2Text") },
    { icon: Award, title: t("v3Title"), text: t("v3Text") },
  ];
  return (
    <>
      <PageHero title={t("title")} intro={t("lead")} />
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-5">
          <p>{t("p1")}</p>
          <p>{t("p2")}</p>
          <p className="flex items-center gap-2 font-medium text-primary"><Languages className="size-5" />{t("languages")}</p>
        </div>
        <div className="grid gap-4">
          {values.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardHeader className="flex-row items-center gap-3 pb-2">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground"><Icon className="size-5" /></span>
                <CardTitle className="text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-[15px] leading-6 text-muted-foreground">{text}</CardContent>
            </Card>
          ))}
        </div>
      </section>
      <CtaBand title={ts("ctaTitle")} text={ts("ctaText")} button={ts("ctaButton")} />
    </>
  );
}
