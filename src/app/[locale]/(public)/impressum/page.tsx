import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/public/legal-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Legal" });
  return { title: t("impressum") };
}

export default async function ImpressumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Legal");
  return <LegalPage kind="impressum" locale={locale} title={t("impressum")} />;
}
