import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { isStaff } from "@/lib/roles";
import { Logo } from "@/components/logo";
import { AdminSidebar } from "@/components/admin-sidebar";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Druga linia obrony (middleware też sprawdza rolę)
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);
  if (!isStaff(session.user.role)) redirect(`/${locale}/panel`);
  const t = await getTranslations("Roles");

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b bg-card p-4 md:min-h-dvh md:border-r md:border-b-0">
        <Link href="/" className="mb-6 hidden px-3 md:block"><Logo className="text-xl" /></Link>
        <AdminSidebar />
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex h-16 items-center justify-end gap-2 border-b px-4">
          <span className="mr-auto text-sm text-muted-foreground">
            {session.user.name ?? session.user.email} · {t(session.user.role)}
          </span>
          <LocaleSwitcher />
          <ThemeToggle />
          <LogoutButton />
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
