import { Check, Mail, Phone, RotateCcw, Trash2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { deleteMessage, setMessageHandled } from "@/lib/actions/content";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { PageHeader } from "@/components/admin/page-header";
import { PAGE_SIZE, Pagination, parsePage } from "@/components/admin/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function MessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ all?: string; page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const all = sp.all === "1";
  const page = parsePage(sp.page);
  const [t, tc] = await Promise.all([getTranslations("AdminMessages"), getTranslations("Common")]);
  const where = all ? {} : { handled: false };
  const [messages, total] = await Promise.all([
    db.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.contactMessage.count({ where }),
  ]);
  const tab = (active: boolean, href: string, label: string) => (
    <Link href={href} className={cn("-mb-px border-b-2 px-4 py-2 text-sm font-semibold", active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
      {label}
    </Link>
  );
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />
      <div className="flex gap-1 border-b">
        {tab(!all, "/admin/messages", t("showOpen"))}
        {tab(all, "/admin/messages?all=1", t("showAll"))}
      </div>
      {messages.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <Card key={m.id} className={m.handled ? "opacity-70" : undefined}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-semibold">{m.name}</span>
                  <a href={`mailto:${m.email}`} className="flex items-center gap-1 text-sm text-primary hover:underline"><Mail className="size-4" />{m.email}</a>
                  {m.phone && <a href={`tel:${m.phone}`} className="flex items-center gap-1 text-sm hover:text-primary"><Phone className="size-4" />{m.phone}</a>}
                  <span className="text-sm text-muted-foreground">{formatDate(m.createdAt, locale, true)}</span>
                  <Badge tone={m.handled ? "gray" : "blue"}>{m.handled ? t("handled") : t("new")}</Badge>
                </div>
                <p className="whitespace-pre-wrap">{m.message}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm"><a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: suppIT.me")}`}><Mail />{t("reply")}</a></Button>
                  <form action={setMessageHandled.bind(null, m.id, !m.handled)}>
                    <SubmitButton size="sm" variant="outline">{m.handled ? <RotateCcw /> : <Check />}{m.handled ? t("markOpen") : t("markHandled")}</SubmitButton>
                  </form>
                  <form action={deleteMessage.bind(null, m.id)}>
                    <ConfirmSubmit size="sm" variant="ghost" className="text-destructive" message={tc("confirmDelete")}><Trash2 />{tc("delete")}</ConfirmSubmit>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Pagination page={page} total={total} basePath="/admin/messages" params={{ all: all ? "1" : undefined }} />
    </div>
  );
}
