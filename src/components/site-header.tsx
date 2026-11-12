import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { homeForRole } from "@/lib/roles";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export async function SiteHeader() {
  const t = await getTranslations("Nav");
  const session = await auth();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="suppIT.me"><Logo /></Link>
        <nav className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
          {session ? (
            <Button asChild size="sm" className="ml-2">
              <Link href={homeForRole(session.user.role)}>
                {session.user.role === "CLIENT" ? t("panel") : t("admin")}
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="ml-2">
              <Link href="/login">{t("login")}</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
