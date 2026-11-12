"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { adminModules } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

export function AdminSidebar({ badges = {} }: { badges?: Record<string, number> }) {
  const t = useTranslations("Admin");
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {adminModules.map(({ key, slug, icon: Icon }) => {
        const href = slug ? `/admin/${slug}` : "/admin";
        const active = slug ? pathname.startsWith(href) : pathname === "/admin";
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {t(key)}
            {badges[key] ? (
              <span className="ml-auto rounded-full bg-primary px-1.5 text-xs leading-5 font-semibold text-primary-foreground">{badges[key]}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
