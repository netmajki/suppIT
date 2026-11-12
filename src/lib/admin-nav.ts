import {
  LayoutDashboard, Users, ClipboardList, CalendarDays, Boxes, Truck, BadgePercent, FileText, Settings,
} from "lucide-react";

/** Moduły panelu admina; `key` = klucz tłumaczenia w Admin.*, `slug` = segment URL. */
export const adminModules = [
  { key: "dashboard", slug: "", icon: LayoutDashboard },
  { key: "clients", slug: "clients", icon: Users },
  { key: "orders", slug: "orders", icon: ClipboardList },
  { key: "calendar", slug: "calendar", icon: CalendarDays },
  { key: "inventory", slug: "inventory", icon: Boxes },
  { key: "partOrders", slug: "part-orders", icon: Truck },
  { key: "promotions", slug: "promotions", icon: BadgePercent },
  { key: "articles", slug: "articles", icon: FileText },
  { key: "settings", slug: "settings", icon: Settings },
] as const;
