import { Mail, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCompanySettings } from "@/lib/settings";
import { Logo } from "@/components/logo";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const company = await getCompanySettings();
  return (
    <footer className="border-t bg-muted/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Logo className="text-xl" />
          {company.address && <p className="text-sm text-muted-foreground">{company.address}</p>}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">{t("contact")}</p>
          <a href={`mailto:${company.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
            <Mail className="size-4" /> {company.email}
          </a>
          <a href={`tel:${company.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
            <Phone className="size-4" /> {company.phone}
          </a>
        </div>
      </div>
      <p className="border-t py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {company.name}. {t("rights")}
      </p>
    </footer>
  );
}
