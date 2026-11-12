"use client";

import { ClipboardList, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function PanelNav() {
  const t = useTranslations("Panel");
  const pathname = usePathname();
  const items = [
    { href: "/panel", label: t("orders"), icon: ClipboardList, active: pathname === "/panel" || pathname.startsWith("/panel/orders") },
    { href: "/panel/settings", label: t("settings"), icon: Settings, active: pathname.startsWith("/panel/settings") },
  ];
  return (
    <nav className="flex gap-1">
      {items.map(({ href, label, icon: Icon, active }) => (
        <Link key={href} href={href} className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium", active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
          <Icon className="size-4" />{label}
        </Link>
      ))}
    </nav>
  );
}
