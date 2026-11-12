import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ClientPanel({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);
  const t = await getTranslations("Panel");

  return (
    <div className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-2 px-4">
          <Link href="/"><Logo className="text-xl" /></Link>
          <div className="flex items-center gap-1">
            <LocaleSwitcher />
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <div>
          <h2>{t("title")}</h2>
          <p className="text-muted-foreground">{t("welcome", { name: session.user.name ?? session.user.email ?? "" })}</p>
        </div>
        <Card>
          <CardContent className="p-6 text-muted-foreground">{t("empty")}</CardContent>
        </Card>
      </main>
    </div>
  );
}
