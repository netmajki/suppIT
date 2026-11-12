import { Plus, Search, MessageCircle } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { whatsappLink } from "@/lib/phone";
import { PageHeader } from "@/components/admin/page-header";
import { PAGE_SIZE, Pagination, parsePage } from "@/components/admin/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q = "", page: pageRaw } = await searchParams;
  const page = parsePage(pageRaw);
  const t = await getTranslations("Clients");
  const tc = await getTranslations("Common");

  const query = q.trim();
  const digits = query.replace(/\D/g, "");
  const where: Prisma.ClientWhereInput = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { companyName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          ...(digits.length >= 3 ? [{ phone: { contains: digits } }, { whatsapp: { contains: digits } }] : []),
        ],
      }
    : {};

  const [clients, total] = await Promise.all([
    db.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { orders: true } } },
    }),
    db.client.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={<Button asChild><Link href="/admin/clients/new"><Plus />{t("new")}</Link></Button>}
      />

      <form className="flex max-w-xl gap-2" role="search">
        <Input name="q" defaultValue={q} placeholder={t("searchPlaceholder")} aria-label={tc("search")} />
        <Button type="submit" variant="outline"><Search />{tc("search")}</Button>
      </form>

      {clients.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{query ? tc("noResults") : t("empty")}</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>{t("name")}</TH>
              <TH>{t("phone")}</TH>
              <TH>{t("email")}</TH>
              <TH className="text-right">{t("ordersCount")}</TH>
            </tr>
          </THead>
          <TBody>
            {clients.map((c) => (
              <TR key={c.id}>
                <TD>
                  <Link href={`/admin/clients/${c.id}`} className="font-medium text-foreground hover:text-primary">{c.name}</Link>
                  {c.companyName && <div className="text-xs text-muted-foreground">{c.companyName}</div>}
                </TD>
                <TD className="whitespace-nowrap">
                  {c.phone ? <a href={`tel:${c.phone}`} className="hover:text-primary">{c.phone}</a> : "—"}
                  {c.whatsapp && (
                    <a href={whatsappLink(c.whatsapp)} target="_blank" rel="noreferrer" title={t("openWhatsapp")} className="ml-2 inline-flex align-middle text-emerald-600 dark:text-emerald-400">
                      <MessageCircle className="size-4" />
                    </a>
                  )}
                </TD>
                <TD>{c.email ?? "—"}</TD>
                <TD className="text-right tabular-nums">{c._count.orders}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={page} total={total} basePath="/admin/clients" params={{ q: query || undefined }} />
    </div>
  );
}
