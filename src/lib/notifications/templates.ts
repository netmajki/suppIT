import type { Locale, NotificationChannel, OrderStatus } from "@prisma/client";

export type TemplateVars = {
  clientName: string;
  orderNumber: string;
  orderTitle: string;
  status: string;
  note: string;
  link: string;
  companyName: string;
};

type Tpl = { subject: string; body: string };

/** Zdania dodatkowe dla wybranych statusów. */
const extra: Record<Locale, Partial<Record<OrderStatus, string>>> = {
  pl: {
    AWAITING_APPROVAL: "Prosimy o akceptację wyceny — odpowiedz na tę wiadomość lub zadzwoń do nas.",
    READY: "Zlecenie jest gotowe do odbioru.",
    COMPLETED: "Dziękujemy za skorzystanie z naszych usług!",
  },
  de: {
    AWAITING_APPROVAL: "Bitte bestätigen Sie den Kostenvoranschlag — antworten Sie auf diese Nachricht oder rufen Sie uns an.",
    READY: "Ihr Auftrag ist abholbereit.",
    COMPLETED: "Vielen Dank, dass Sie unseren Service genutzt haben!",
  },
  en: {
    AWAITING_APPROVAL: "Please approve the quote — reply to this message or give us a call.",
    READY: "Your order is ready for pickup.",
    COMPLETED: "Thank you for choosing us!",
  },
};

const base: Record<Locale, { email: Tpl; whatsapp: Tpl }> = {
  pl: {
    email: {
      subject: "Zlecenie {{orderNumber}}: {{status}}",
      body: "Dzień dobry {{clientName}},\n\nstatus Twojego zlecenia {{orderNumber}} ({{orderTitle}}) zmienił się na: {{status}}.\n{{extra}}\n{{note}}\n\nSzczegóły: {{link}}\n\nPozdrawiamy,\n{{companyName}}",
    },
    whatsapp: {
      subject: "",
      body: "Dzień dobry {{clientName}}! Zlecenie {{orderNumber}} ({{orderTitle}}) — nowy status: *{{status}}*. {{extra}} {{note}}\n{{link}}",
    },
  },
  de: {
    email: {
      subject: "Auftrag {{orderNumber}}: {{status}}",
      body: "Guten Tag {{clientName}},\n\nder Status Ihres Auftrags {{orderNumber}} ({{orderTitle}}) wurde geändert auf: {{status}}.\n{{extra}}\n{{note}}\n\nDetails: {{link}}\n\nMit freundlichen Grüßen\n{{companyName}}",
    },
    whatsapp: {
      subject: "",
      body: "Guten Tag {{clientName}}! Auftrag {{orderNumber}} ({{orderTitle}}) — neuer Status: *{{status}}*. {{extra}} {{note}}\n{{link}}",
    },
  },
  en: {
    email: {
      subject: "Order {{orderNumber}}: {{status}}",
      body: "Hello {{clientName}},\n\nthe status of your order {{orderNumber}} ({{orderTitle}}) has changed to: {{status}}.\n{{extra}}\n{{note}}\n\nDetails: {{link}}\n\nBest regards,\n{{companyName}}",
    },
    whatsapp: {
      subject: "",
      body: "Hello {{clientName}}! Order {{orderNumber}} ({{orderTitle}}) — new status: *{{status}}*. {{extra}} {{note}}\n{{link}}",
    },
  },
};

/** Domyślny szablon (używany, gdy w bazie nie ma własnego NotificationTemplate). */
export function defaultTemplate(status: OrderStatus, channel: NotificationChannel, locale: Locale): Tpl {
  const tpl = base[locale][channel === "EMAIL" ? "email" : "whatsapp"];
  const ex = extra[locale][status] ?? "";
  return { subject: tpl.subject, body: tpl.body.replace("{{extra}}", ex) };
}

/** Podstawia {{zmienne}}; nieznane zmienne zostają usunięte. Usuwa puste linie powstałe po podstawieniu. */
export function renderTemplate(text: string, vars: TemplateVars) {
  return text
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => (k in vars ? vars[k as keyof TemplateVars] : ""))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ {2,}/g, " ")
    .trim();
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Prosty, brandowany HTML dla e-maili. */
export function emailHtml(text: string, companyName: string) {
  const body = esc(text)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#1E63D6">$1</a>')
    .replace(/\n/g, "<br>");
  return `<!doctype html><html><body style="margin:0;background:#f3f5f8;font-family:Inter,Arial,sans-serif;color:#3A4552">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;border:1px solid #e2e6ec">
<tr><td style="padding:20px 28px;border-bottom:3px solid #1E63D6;font:700 22px Poppins,Arial,sans-serif">supp<span style="color:#1E63D6">IT</span><span style="color:#8792A2">.me</span></td></tr>
<tr><td style="padding:28px;font-size:16px;line-height:26px">${body}</td></tr>
<tr><td style="padding:16px 28px;font-size:12px;color:#8792A2;border-top:1px solid #e2e6ec">${esc(companyName)}</td></tr>
</table></td></tr></table></body></html>`;
}
