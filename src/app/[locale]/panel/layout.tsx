import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCompanySettings } from "@/lib/settings";
import { getClientSession } from "@/lib/client-session";
import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoutButton } from "@/components/logout-button";
import { PanelNav } from "@/components/panel-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function PanelLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await getClientSession();
  const company = await getCompanySettings();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-2 px-4">
          <Link href="/" className="shrink-0"><Logo className="h-8" src={company.logoUrl} /></Link>
          <div className="flex items-center gap-1">
            <LocaleSwitcher />
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-2"><PanelNav /></div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8">{children}</main>
    </div>
  );
}
