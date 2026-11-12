import "server-only";
import { decryptSecret } from "@/lib/crypto";
import { db } from "@/lib/db";

export type EmailConfig =
  | { provider: "smtp"; from: string; host: string; port: number; secure: boolean; user?: string; pass?: string }
  | { provider: "resend"; from: string; apiKey: string }
  | { provider: "none" };

export type WhatsAppConfig =
  | {
      provider: "meta";
      phoneNumberId: string;
      accessToken: string;
      /** Nazwa zatwierdzonego szablonu (wymagana poza 24-h oknem rozmowy). Pusta → zwykła wiadomość tekstowa. */
      templateName?: string;
      apiVersion: string;
    }
  | { provider: "twilio"; accountSid: string; authToken: string; from: string; contentSid?: string }
  | { provider: "none" };

/**
 * Konfiguracja powiadomień: najpierw tabela Setting (edytowalna w Ustawieniach — etap 5),
 * potem zmienne środowiskowe.
 */
async function readSettings() {
  try {
    const rows = await db.setting.findMany({ where: { OR: [{ key: { startsWith: "email." } }, { key: { startsWith: "whatsapp." } }] } });
    return Object.fromEntries(rows.map((r) => [r.key, typeof r.value === "string" ? decryptSecret(r.value) : String(r.value ?? "")]));
  } catch {
    return {} as Record<string, string>;
  }
}

const pick = (s: Record<string, string>, key: string, env?: string) => (s[key] || (env ? process.env[env] : "") || "").trim();

export async function getNotificationConfig(): Promise<{ email: EmailConfig; whatsapp: WhatsAppConfig }> {
  const s = await readSettings();

  // E-mail
  let email: EmailConfig = { provider: "none" };
  const emailProvider = pick(s, "email.provider", "EMAIL_PROVIDER") || (process.env.RESEND_API_KEY ? "resend" : process.env.SMTP_HOST ? "smtp" : "none");
  const from = pick(s, "email.from", "EMAIL_FROM") || "suppIT.me <kontakt@suppit.me>";
  if (emailProvider === "resend") {
    const apiKey = pick(s, "email.resendApiKey", "RESEND_API_KEY");
    if (apiKey) email = { provider: "resend", from, apiKey };
  } else if (emailProvider === "smtp") {
    const host = pick(s, "email.smtpHost", "SMTP_HOST");
    const port = Number(pick(s, "email.smtpPort", "SMTP_PORT") || 587);
    if (host)
      email = {
        provider: "smtp",
        from,
        host,
        port,
        secure: port === 465,
        user: pick(s, "email.smtpUser", "SMTP_USER") || undefined,
        pass: pick(s, "email.smtpPass", "SMTP_PASS") || undefined,
      };
  }

  // WhatsApp (domyślnie Meta Cloud API)
  let whatsapp: WhatsAppConfig = { provider: "none" };
  const waProvider = pick(s, "whatsapp.provider", "WHATSAPP_PROVIDER") || "meta";
  if (waProvider === "meta") {
    const phoneNumberId = pick(s, "whatsapp.metaPhoneNumberId", "META_WA_PHONE_NUMBER_ID");
    const accessToken = pick(s, "whatsapp.metaAccessToken", "META_WA_ACCESS_TOKEN");
    if (phoneNumberId && accessToken)
      whatsapp = {
        provider: "meta",
        phoneNumberId,
        accessToken,
        templateName: pick(s, "whatsapp.metaTemplateName", "META_WA_TEMPLATE_NAME") || undefined,
        apiVersion: pick(s, "whatsapp.metaApiVersion", "META_WA_API_VERSION") || "v21.0",
      };
  } else if (waProvider === "twilio") {
    const accountSid = pick(s, "whatsapp.twilioAccountSid", "TWILIO_ACCOUNT_SID");
    const authToken = pick(s, "whatsapp.twilioAuthToken", "TWILIO_AUTH_TOKEN");
    const fromNum = pick(s, "whatsapp.twilioFrom", "TWILIO_WHATSAPP_FROM");
    if (accountSid && authToken && fromNum)
      whatsapp = {
        provider: "twilio",
        accountSid,
        authToken,
        from: fromNum,
        contentSid: pick(s, "whatsapp.twilioContentSid", "TWILIO_CONTENT_SID") || undefined,
      };
  }

  return { email, whatsapp };
}
