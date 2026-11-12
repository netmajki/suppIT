import "server-only";
import type { Locale } from "@prisma/client";
import { db } from "@/lib/db";
import { getCompanySettings } from "@/lib/settings";
import { getNotificationConfig } from "./config";
import { sendEmail } from "./email";
import { emailHtml } from "./templates";

/** E-mail do firmy (nowe zgłoszenie, wiadomość z formularza). Nie rzuca wyjątków. */
export async function sendAdminEmail(subject: string, text: string, replyTo?: string) {
  try {
    const [config, company] = await Promise.all([getNotificationConfig(), getCompanySettings()]);
    const s = await db.setting.findUnique({ where: { key: "notifications.adminEmail" } });
    const to = (typeof s?.value === "string" && s.value) || company.email;
    if (config.email.provider === "none") {
      console.warn(`[admin-email] e-mail nie skonfigurowany — pominięto: ${subject}`);
      return;
    }
    await sendEmail(config.email, { to, subject, text: replyTo ? `${text}\n\nReply-To: ${replyTo}` : text, html: emailHtml(text, company.name) });
  } catch (e) {
    console.error("[admin-email]", e);
  }
}

const confirm: Record<Locale, { subject: string; body: string }> = {
  pl: {
    subject: "Przyjęliśmy zgłoszenie {number}",
    body: "Dzień dobry {name},\n\ndziękujemy za zgłoszenie. Nadaliśmy mu numer {number}.\nSkontaktujemy się wkrótce z diagnozą i wyceną. O każdej zmianie statusu poinformujemy Cię e-mailem.\n\nPozdrawiamy,\n{company}",
  },
  de: {
    subject: "Wir haben Ihre Anfrage {number} erhalten",
    body: "Guten Tag {name},\n\nvielen Dank für Ihre Anfrage. Sie hat die Nummer {number}.\nWir melden uns in Kürze mit Diagnose und Kostenvoranschlag. Über jede Statusänderung informieren wir Sie per E-Mail.\n\nMit freundlichen Grüßen\n{company}",
  },
  en: {
    subject: "We have received your request {number}",
    body: "Hello {name},\n\nthank you for your request. Its number is {number}.\nWe will get back to you shortly with a diagnosis and quote, and notify you by e-mail about every status change.\n\nBest regards,\n{company}",
  },
};

/** Potwierdzenie przyjęcia zgłoszenia dla klienta (zapisywane w NotificationLog). */
export async function sendRepairConfirmation(opts: { orderId: string; email: string; name: string; number: string; locale: Locale }) {
  const log = await db.notificationLog.create({ data: { channel: "EMAIL", recipient: opts.email, orderId: opts.orderId } });
  try {
    const [config, company] = await Promise.all([getNotificationConfig(), getCompanySettings()]);
    const tpl = confirm[opts.locale];
    const fill = (s: string) => s.replace(/\{name\}/g, opts.name).replace(/\{number\}/g, opts.number).replace(/\{company\}/g, company.name);
    const text = fill(tpl.body);
    await sendEmail(config.email, { to: opts.email, subject: fill(tpl.subject), text, html: emailHtml(text, company.name) });
    await db.notificationLog.update({ where: { id: log.id }, data: { state: "SENT", sentAt: new Date() } });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await db.notificationLog.update({ where: { id: log.id }, data: { state: "FAILED", error: error.slice(0, 1000) } });
  }
}
