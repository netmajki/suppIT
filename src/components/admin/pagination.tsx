import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export const PAGE_SIZE = 25;

export async function Pagination({
  page,
  total,
  basePath,
  params,
}: {
  page: number;
  total: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  const t = await getTranslations("Common");
  const href = (p: number) => {
    const q = new URLSearchParams(Object.entries({ ...params, page: String(p) }).filter(([, v]) => v) as [string, string][]);
    return `${basePath}?${q}`;
  };
  return (
    <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>{t("pageOf", { page, pages })}</span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button asChild variant="outline" size="sm"><Link href={href(page - 1)}><ChevronLeft />{t("prev")}</Link></Button>
        ) : (
          <Button variant="outline" size="sm" disabled><ChevronLeft />{t("prev")}</Button>
        )}
        {page < pages ? (
          <Button asChild variant="outline" size="sm"><Link href={href(page + 1)}>{t("next")}<ChevronRight /></Link></Button>
        ) : (
          <Button variant="outline" size="sm" disabled>{t("next")}<ChevronRight /></Button>
        )}
      </div>
    </div>
  );
}

export const parsePage = (v?: string) => Math.max(1, Number.parseInt(v ?? "1", 10) || 1);
