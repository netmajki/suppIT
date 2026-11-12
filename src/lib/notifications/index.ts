import "server-only";
import type { Locale, NotificationChannel } from "@prisma/client";
import { db } from "@/lib/db";
import { formatOrderNumber } from "@/lib/order-meta";
import { getCompanySettings } from "@/lib/settings";
import pl from "../../../messages/pl.json";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import { getNotificationConfig } from "./config";
import { sendEmail } from "./email";
import { sendWhatsApp } from "./whatsapp";
import { defaultTemplate, emailHtml, renderTemplate, type TemplateVars } from "./templates";

const messages = { pl, de, en } as const;

const noteLabel: Record<Locale, string> = { pl: "Uwagi", de: "Hinweis", en: "Note" };

/**
 * Wysyła powiadomienia o zmianie statusu (e-mail i/lub WhatsApp — wg preferencji klienta).
 * Każda próba jest zapisywana w NotificationLog. Nie rzuca wyjątków.
 */
export async function notifyStatusChange(statusChangeId: string) {
  const change = await db.orderStatusChange.findUnique({
    where: { id: statusChangeId },
    include: { order: { include: { client: true } } },
  });
  if (!change) return;
  const { order } = change;
  const client = order.client;
  const locale = client.locale;
  const [config, company] = await Promise.all([getNotificationConfig(), getCompanySettings()]);
  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const vars: TemplateVars = {
    clientName: client.name,
    orderNumber: formatOrderNumber(order.number),
    orderTitle: order.title,
    status: messages[locale].Status[change.toStatus],
    note: change.note ? `${noteLabel[locale]}: ${change.note}` : "",
    link: `${appUrl}/${locale}/panel`,
    companyName: company.name,
  };

  const jobs: { channel: NotificationChannel; recipient: string }[] = [];
  if (client.notifyEmail && client.email) jobs.push({ channel: "EMAIL", recipient: client.email });
  if (client.notifyWhatsapp && client.whatsapp) jobs.push({ channel: "WHATSAPP", recipient: client.whatsapp });

  for (const job of jobs) {
    const custom = await db.notificationTemplate.findUnique({
      where: { status_channel_locale: { status: change.toStatus, channel: job.channel, locale } },
    });
    if (custom && !custom.active) continue; // szablon wyłączony → brak powiadomienia dla tego statusu/kanału
    const tpl = custom ? { subject: custom.subject ?? "", body: custom.body } : defaultTemplate(change.toStatus, job.channel, locale);

    const log = await db.notificationLog.create({
      data: { channel: job.channel, recipient: job.recipient, orderId: order.id },
    });
    try {
      const text = renderTemplate(tpl.body, vars);
      if (job.channel === "EMAIL") {
        await sendEmail(config.email, {
          to: job.recipient,
          subject: renderTemplate(tpl.subject || "{{orderNumber}}: {{status}}", vars),
          text,
          html: emailHtml(text, company.name),
        });
      } else {
        await sendWhatsApp(config.whatsapp, {
          to: job.recipient,
          text,
          language: locale,
          // Kolejność parametrów szablonu Meta/Twilio: {{1}} klient, {{2}} nr zlecenia, {{3}} status, {{4}} uwagi
          templateParams: [vars.clientName, vars.orderNumber, vars.status, change.note || "-"],
        });
      }
      await db.notificationLog.update({ where: { id: log.id }, data: { state: "SENT", sentAt: new Date() } });
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error(`[notify] ${job.channel} → ${job.recipient}: ${error}`);
      await db.notificationLog.update({ where: { id: log.id }, data: { state: "FAILED", error: error.slice(0, 1000) } });
    }
  }
}
