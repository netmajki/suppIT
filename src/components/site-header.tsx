import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { homeForRole } from "@/lib/roles";
import { getCompanySettings } from "@/lib/settings";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PublicNav } from "@/components/public-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export async function SiteHeader() {
  const t = await getTranslations("Nav");
  const [session, company] = await Promise.all([auth(), getCompanySettings()]);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/" aria-label="suppIT.me" className="shrink-0"><Logo className="h-8 sm:h-9" src={company.logoUrl} /></Link>
        <div className="flex items-center gap-1">
          <PublicNav
            account={
              session
                ? { href: homeForRole(session.user.role), label: session.user.role === "CLIENT" ? t("panel") : t("admin") }
                : { href: "/login", label: t("login") }
            }
          />
          <LocaleSwitcher />
          <ThemeToggle />
          {session ? (
            <Button asChild size="sm" className="ml-1 hidden sm:inline-flex">
              <Link href={homeForRole(session.user.role)}>{session.user.role === "CLIENT" ? t("panel") : t("admin")}</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="ml-1 hidden sm:inline-flex">
              <Link href="/login">{t("login")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
