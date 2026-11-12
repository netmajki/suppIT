import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { normalizePhone, whatsappLink } from "@/lib/phone";
import { getCompanySettings } from "@/lib/settings";
import { PageHero } from "@/components/page-hero";
import { ContactForm } from "@/components/public/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Contact" });
  return { title: t("title"), description: t("intro") };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, company] = await Promise.all([getTranslations("Contact"), getCompanySettings()]);
  const wa = normalizePhone(company.phone);
  return (
    <>
      <PageHero title={t("title")} intro={t("intro")} />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1fr_360px]">
        <Card><CardContent className="pt-6"><ContactForm /></CardContent></Card>
        <Card className="h-fit">
          <CardHeader><CardTitle>{t("details")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <a href={`mailto:${company.email}`} className="flex items-center gap-3 hover:text-primary"><Mail className="size-5 text-primary" />{company.email}</a>
            <a href={`tel:${company.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 hover:text-primary"><Phone className="size-5 text-primary" />{company.phone}</a>
            {wa && (
              <a href={whatsappLink(wa)} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-primary">
                <MessageCircle className="size-5 text-emerald-600" />{t("writeWhatsapp")}
              </a>
            )}
            {company.address && <p className="flex items-start gap-3"><MapPin className="mt-1 size-5 shrink-0 text-primary" />{company.address}</p>}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
