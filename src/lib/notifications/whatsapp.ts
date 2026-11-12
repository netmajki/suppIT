import "server-only";
import type { WhatsAppConfig } from "./config";

export type WhatsAppMessage = {
  /** Numer odbiorcy w formacie E.164 (+48...) */
  to: string;
  /** Treść wiadomości tekstowej (gdy nie używamy szablonu) */
  text: string;
  /** Parametry szablonu ({{1}}, {{2}}, ...) — w kolejności */
  templateParams: string[];
  /** Kod języka szablonu, np. "pl", "de", "en" */
  language: string;
};

/**
 * Wysyła wiadomość WhatsApp.
 * Uwaga: wiadomości inicjowane przez firmę poza 24-godzinnym oknem rozmowy
 * wymagają zatwierdzonego szablonu (Meta: templateName, Twilio: contentSid).
 */
export async function sendWhatsApp(config: WhatsAppConfig, msg: WhatsAppMessage) {
  if (config.provider === "none") throw new Error("WhatsApp nie jest skonfigurowany");

  if (config.provider === "meta") {
    const to = msg.to.replace(/^\+/, "");
    const body = config.templateName
      ? {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: config.templateName,
            language: { code: msg.language },
            components: [{ type: "body", parameters: msg.templateParams.map((text) => ({ type: "text", text })) }],
          },
        }
      : { messaging_product: "whatsapp", to, type: "text", text: { body: msg.text } };

    const res = await fetch(`https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Meta WhatsApp ${res.status}: ${await res.text()}`);
    return;
  }

  // Twilio
  const params = new URLSearchParams({
    From: config.from.startsWith("whatsapp:") ? config.from : `whatsapp:${config.from}`,
    To: `whatsapp:${msg.to}`,
  });
  if (config.contentSid) {
    params.set("ContentSid", config.contentSid);
    params.set("ContentVariables", JSON.stringify(Object.fromEntries(msg.templateParams.map((v, i) => [String(i + 1), v]))));
  } else {
    params.set("Body", msg.text);
  }
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);
}
