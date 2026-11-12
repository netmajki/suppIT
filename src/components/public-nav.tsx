"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { publicNav } from "@/lib/public-nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PublicNav({ account }: { account: { href: string; label: string } }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
        {publicNav.map((l) => (
          <Link
            key={l.key}
            href={l.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(l.href) ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(l.key)}
          </Link>
        ))}
      </nav>
      <Button variant="ghost" size="icon" className="lg:hidden" aria-label={open ? t("close") : t("menu")} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? <X /> : <Menu />}
      </Button>
      {open && (
        <div className="absolute inset-x-0 top-16 border-b bg-background shadow-lg lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col p-4">
            {publicNav.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                className={cn("rounded-md px-3 py-3 font-medium", isActive(l.href) ? "bg-accent text-accent-foreground" : "hover:bg-muted")}
              >
                {t(l.key)}
              </Link>
            ))}
            <Link href={account.href} className="mt-2 rounded-md border px-3 py-3 text-center font-semibold sm:hidden">
              {account.label}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
