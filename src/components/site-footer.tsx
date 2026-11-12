import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { normalizePhone, whatsappLink } from "@/lib/phone";
import { publicNav } from "@/lib/public-nav";
import { getCompanySettings } from "@/lib/settings";
import { Logo } from "@/components/logo";

export async function SiteFooter() {
  const [t, tn, tc, tl] = await Promise.all([getTranslations("Footer"), getTranslations("Nav"), getTranslations("Contact"), getTranslations("Legal")]);
  const company = await getCompanySettings();
  const wa = normalizePhone(company.phone, company.phoneCountryCode);
  return (
    <footer className="border-t bg-muted/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-3">
          <Logo className="h-8" src={company.logoUrl} />
          <p className="text-sm text-muted-foreground">{(await getTranslations("Meta"))("description")}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">{t("pages")}</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {[...publicNav, { key: "partners", href: "/partners" } as const].map((l) => (
              <li key={l.key}><Link href={l.href} className="text-muted-foreground hover:text-primary">{tn(l.key)}</Link></li>
            ))}
            <li><Link href="/login" className="text-muted-foreground hover:text-primary">{tn("login")}</Link></li>
          </ul>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">{t("contact")}</p>
          <a href={`mailto:${company.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary"><Mail className="size-4" /> {company.email}</a>
          <a href={`tel:${company.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary"><Phone className="size-4" /> {company.phone}</a>
          {wa && (
            <a href={whatsappLink(wa)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
              <MessageCircle className="size-4" /> {tc("writeWhatsapp")}
            </a>
          )}
          {company.address && <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="mt-1 size-4 shrink-0" />{company.address}</p>}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 border-t px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:gap-6">
        <span>© {new Date().getFullYear()} {company.name}. {t("rights")}</span>
        <span className="flex gap-4">
          <Link href="/impressum" className="hover:text-primary">{tl("impressum")}</Link>
          <Link href="/datenschutz" className="hover:text-primary">{tl("privacy")}</Link>
        </span>
      </div>
    </footer>
  );
}
