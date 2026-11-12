"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "tabCompany", href: "/admin/settings", admin: true },
  { key: "tabNotifications", href: "/admin/settings/notifications", admin: true },
  { key: "tabTemplates", href: "/admin/settings/templates", admin: true },
  { key: "tabLegal", href: "/admin/settings/legal", admin: true },
  { key: "tabUsers", href: "/admin/settings/users", admin: true },
  { key: "tabAccount", href: "/admin/settings/account", admin: false },
] as const;

export function SettingsTabs({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations("Settings");
  const pathname = usePathname();
  return (
    <div className="flex gap-1 overflow-x-auto border-b">
      {TABS.filter((tab) => isAdmin || !tab.admin).map((tab) => {
        const active = tab.href === "/admin/settings" ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-4 py-2 text-sm font-semibold whitespace-nowrap",
              active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </div>
  );
}
